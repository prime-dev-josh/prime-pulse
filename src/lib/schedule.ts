import type {
	EmailTemplate,
	EmployeeRow,
	MilestoneType,
	SkippedNote,
	TemplateKind,
	UpcomingPerson,
	UpcomingSend,
} from "#/lib/types";

export const UNASSIGNED_MANAGER = "No manager in ADP";

export type SendSkipRef = {
	templateId: number;
	associateOID: string;
	milestoneType: MilestoneType;
	milestoneDate: string;
};

export const COMPANY_ZONE = "America/New_York";

export const PLACEHOLDERS: Record<
	TemplateKind,
	Array<{ token: string; meaning: string }>
> = {
	employee_day_of: [
		{ token: "{{employeeName}}", meaning: "Full name" },
		{ token: "{{firstName}}", meaning: "First name" },
		{ token: "{{milestoneType}}", meaning: "Birthday or anniversary" },
		{ token: "{{date}}", meaning: "The milestone date" },
		{ token: "{{years}}", meaning: "Years at Prime AE, for anniversaries" },
	],
	manager_monthly: [
		{ token: "{{managerName}}", meaning: "The manager's name" },
		{ token: "{{month}}", meaning: "The month being reported" },
		{
			token: "{{employeeList}}",
			meaning: "Each person's name, date, and type",
		},
		{ token: "{{count}}", meaning: "How many people are listed" },
	],
	ceo_anniversary: [
		{ token: "{{employeeName}}", meaning: "Full name" },
		{ token: "{{firstName}}", meaning: "First name" },
		{ token: "{{date}}", meaning: "The anniversary date" },
		{ token: "{{years}}", meaning: "Years at Prime AE" },
	],
	ceo_monthly: [
		{ token: "{{month}}", meaning: "The month being reported" },
		{
			token: "{{employeeList}}",
			meaning: "Each person's name, date, and type",
		},
		{ token: "{{count}}", meaning: "How many people are listed" },
	],
};

function pad(value: number) {
	return String(value).padStart(2, "0");
}

export function todayIso(now = new Date(), timeZone = COMPANY_ZONE) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(now);
	const year = parts.find((part) => part.type === "year")?.value;
	const month = parts.find((part) => part.type === "month")?.value;
	const day = parts.find((part) => part.type === "day")?.value;
	return `${year}-${month}-${day}`;
}

export function parseIso(iso: string | null) {
	if (!iso) return null;
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	return { year, month, day };
}

export function toIso(year: number, month: number, day: number) {
	return `${pad(year)}-${pad(month)}-${pad(day)}`;
}

function daysInMonth(year: number, month: number) {
	return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function clampDay(year: number, month: number, day: number) {
	return Math.min(day, daysInMonth(year, month));
}

export function addDays(iso: string, days: number) {
	const parsed = parseIso(iso);
	if (!parsed) return iso;
	const date = new Date(
		Date.UTC(parsed.year, parsed.month - 1, parsed.day + days),
	);
	return toIso(
		date.getUTCFullYear(),
		date.getUTCMonth() + 1,
		date.getUTCDate(),
	);
}

export function compareIso(a: string, b: string) {
	return a.localeCompare(b);
}

export function firstName(displayName: string) {
	return displayName.trim().split(/\s+/)[0] || displayName;
}

export function yearsOn(sourceIso: string | null, onIso: string) {
	const source = parseIso(sourceIso);
	const on = parseIso(onIso);
	if (!source || !on || source.year === 0) return null;
	let years = on.year - source.year;
	if (
		on.month < source.month ||
		(on.month === source.month && on.day < source.day)
	) {
		years -= 1;
	}
	return years < 0 ? null : years;
}

export function nextMonthDay(
	month: number,
	day: number,
	fromIso: string,
): string | null {
	const from = parseIso(fromIso);
	if (!from) return null;
	for (let year = from.year; year <= from.year + 1; year += 1) {
		if (month === 2 && day === 29 && daysInMonth(year, 2) < 29) {
			const candidate = toIso(year, 2, 28);
			if (compareIso(candidate, fromIso) >= 0) return candidate;
			continue;
		}
		if (day > daysInMonth(year, month)) continue;
		const candidate = toIso(year, month, day);
		if (compareIso(candidate, fromIso) >= 0) return candidate;
	}
	return null;
}

export function nextManagerWindow(daysBefore: number, fromIso: string) {
	const from = parseIso(fromIso);
	if (!from) {
		return {
			sendDate: fromIso,
			monthStart: fromIso,
			month: 1,
			year: 2026,
		};
	}
	const lead = Math.min(28, Math.max(0, Math.trunc(daysBefore)));
	for (let offset = 0; offset <= 14; offset += 1) {
		const monthIndex = from.month - 1 + offset;
		const year = from.year + Math.floor(monthIndex / 12);
		const month = (monthIndex % 12) + 1;
		const monthStart = toIso(year, month, 1);
		const sendDate = addDays(monthStart, -lead);
		if (compareIso(sendDate, fromIso) >= 0) {
			return { sendDate, monthStart, month, year };
		}
	}
	return {
		sendDate: fromIso,
		monthStart: toIso(from.year, from.month, 1),
		month: from.month,
		year: from.year,
	};
}

export function monthLabel(year: number, month: number) {
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(Date.UTC(year, month - 1, 1)));
}

function dateForType(employee: EmployeeRow, type: MilestoneType) {
	return type === "anniversary" ? employee.anniversaryDate : employee.birthDate;
}

function personEvent(
	employee: EmployeeRow,
	type: MilestoneType,
	onIso: string,
): UpcomingPerson | null {
	const date = dateForType(employee, type);
	if (!date) return null;
	return {
		associateOID: employee.associateOID,
		displayName: employee.displayName,
		email: employee.email,
		milestoneType: type,
		date,
		years: type === "anniversary" ? yearsOn(date, onIso) : null,
	};
}

function fill(
	text: string,
	values: Record<string, string | number | null | undefined>,
) {
	return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
		const value = values[key];
		if (value == null || value === "") return "";
		return String(value);
	});
}

function employeeListText(
	people: UpcomingPerson[],
	formatDate: (iso: string) => string,
) {
	return people
		.map((person) => {
			const years =
				person.milestoneType === "anniversary" && person.years != null
					? ` (${person.years} year${person.years === 1 ? "" : "s"})`
					: "";
			return `• ${person.displayName} — ${person.milestoneType} ${formatDate(person.date)}${years}`;
		})
		.join("\n");
}

export function renderSubject(
	template: EmailTemplate,
	values: Record<string, string | number | null | undefined>,
) {
	return fill(template.emailSubject, values);
}

export function renderBody(
	template: EmailTemplate,
	values: Record<string, string | number | null | undefined>,
) {
	return fill(template.emailBody, values);
}

function rendered(
	template: EmailTemplate,
	values: Record<string, string | number | null | undefined>,
) {
	return {
		subjectPreview: renderSubject(template, values),
		bodyPreview: renderBody(template, values),
	};
}

export function upcomingSends(
	templates: EmailTemplate[],
	employees: EmployeeRow[],
	fromIso: string,
	formatDate: (iso: string) => string,
): UpcomingSend[] {
	const sends: UpcomingSend[] = [];
	for (const template of templates) {
		if (!template.enabled) continue;
		if (template.kind === "employee_day_of") {
			sends.push(...employeeDaySends(template, employees, fromIso, formatDate));
		} else if (template.kind === "manager_monthly") {
			sends.push(
				...managerMonthSends(template, employees, fromIso, formatDate),
			);
		} else if (template.kind === "ceo_monthly") {
			sends.push(...ceoMonthSends(template, employees, fromIso, formatDate));
		} else {
			sends.push(...ceoSends(template, employees, fromIso, formatDate));
		}
	}
	return sends.sort((a, b) => {
		const byDate = compareIso(a.sendDate, b.sendDate);
		if (byDate !== 0) return byDate;
		return a.recipientName.localeCompare(b.recipientName);
	});
}

function employeeDaySends(
	template: EmailTemplate,
	employees: EmployeeRow[],
	fromIso: string,
	formatDate: (iso: string) => string,
) {
	const sends: UpcomingSend[] = [];
	for (const employee of employees) {
		for (const type of template.milestoneTypes) {
			const source = dateForType(employee, type);
			const parsed = parseIso(source);
			if (!parsed) continue;
			const sendDate = nextMonthDay(parsed.month, parsed.day, fromIso);
			if (!sendDate) continue;
			if (compareIso(sendDate, addDays(fromIso, 60)) > 0) continue;
			const person = personEvent(employee, type, sendDate);
			if (!person) continue;
			const recipients = [employee.email, ...template.recipientEmails].filter(
				(value): value is string => Boolean(value),
			);
			sends.push({
				id: `${template.id}:${type}:${employee.associateOID}:${sendDate}`,
				templateId: template.id,
				templateName: template.name,
				kind: template.kind,
				sendDate,
				sendAt: template.sendAt,
				recipientName: employee.displayName,
				recipientEmails: [...new Set(recipients)],
				summary: `${type} on ${formatDate(sendDate)}`,
				...rendered(template, {
					employeeName: employee.displayName,
					firstName: firstName(employee.displayName),
					milestoneType: type,
					date: formatDate(sendDate),
					years: person.years,
				}),
				employees: [person],
			});
		}
	}
	return sends;
}

function peopleInMonth(
	employee: EmployeeRow,
	template: EmailTemplate,
	window: { month: number; year: number },
) {
	const people: UpcomingPerson[] = [];
	for (const type of template.milestoneTypes) {
		const source = dateForType(employee, type);
		const parsed = parseIso(source);
		if (!parsed || parsed.month !== window.month) continue;
		const onIso = toIso(
			window.year,
			parsed.month,
			clampDay(window.year, parsed.month, parsed.day),
		);
		const person = personEvent(employee, type, onIso);
		if (person) people.push(person);
	}
	return people;
}

function managerMonthSends(
	template: EmailTemplate,
	employees: EmployeeRow[],
	fromIso: string,
	formatDate: (iso: string) => string,
) {
	const window = nextManagerWindow(template.daysBeforeMonthStart, fromIso);
	const grouped = new Map<string, UpcomingPerson[]>();
	const names = new Map<string, string>();
	const emails = new Map<string, string | null>();
	for (const employee of employees) {
		const people = peopleInMonth(employee, template, window);
		if (!people.length) continue;
		const key = employee.managerOID ?? "unassigned";
		const current = grouped.get(key) ?? [];
		current.push(...people);
		grouped.set(key, current);
		names.set(
			key,
			employee.managerName ?? (key === "unassigned" ? UNASSIGNED_MANAGER : key),
		);
		emails.set(key, employee.managerEmail);
	}
	const month = monthLabel(window.year, window.month);
	const sends: UpcomingSend[] = [];
	for (const [key, people] of grouped) {
		people.sort((a, b) => a.date.slice(5).localeCompare(b.date.slice(5)));
		const managerName = names.get(key) ?? key;
		const recipients = [emails.get(key), ...template.recipientEmails].filter(
			(value): value is string => Boolean(value),
		);
		sends.push({
			id: `${template.id}:manager:${key}:${window.sendDate}`,
			templateId: template.id,
			templateName: template.name,
			kind: template.kind,
			sendDate: window.sendDate,
			sendAt: template.sendAt,
			recipientName: managerName,
			recipientEmails: [...new Set(recipients)],
			summary: `${people.length} milestone${people.length === 1 ? "" : "s"} in ${month}`,
			...rendered(template, {
				managerName,
				month,
				count: people.length,
				employeeList: employeeListText(people, formatDate),
			}),
			employees: people,
		});
	}
	return sends;
}

function ceoMonthSends(
	template: EmailTemplate,
	employees: EmployeeRow[],
	fromIso: string,
	formatDate: (iso: string) => string,
) {
	const window = nextManagerWindow(template.daysBeforeMonthStart, fromIso);
	const people: UpcomingPerson[] = [];
	for (const employee of employees) {
		people.push(...peopleInMonth(employee, template, window));
	}
	if (!people.length) return [];
	people.sort((a, b) => a.date.slice(5).localeCompare(b.date.slice(5)));
	const month = monthLabel(window.year, window.month);
	return [
		{
			id: `${template.id}:ceo-month:${window.sendDate}`,
			templateId: template.id,
			templateName: template.name,
			kind: template.kind,
			sendDate: window.sendDate,
			sendAt: template.sendAt,
			recipientName: "CEO",
			recipientEmails: template.recipientEmails,
			summary: `${people.length} milestone${people.length === 1 ? "" : "s"} in ${month}`,
			...rendered(template, {
				month,
				count: people.length,
				employeeList: employeeListText(people, formatDate),
			}),
			employees: people,
		},
	];
}

function ceoSends(
	template: EmailTemplate,
	employees: EmployeeRow[],
	fromIso: string,
	formatDate: (iso: string) => string,
) {
	const marks = new Set(template.anniversaryYears);
	const sends: UpcomingSend[] = [];
	for (const employee of employees) {
		if (!template.milestoneTypes.includes("anniversary")) continue;
		const parsed = parseIso(employee.anniversaryDate);
		if (!parsed || parsed.year === 0) continue;
		for (
			let year = Math.max(
				parsed.year + 1,
				parseIso(fromIso)?.year ?? parsed.year,
			);
			year <= parsed.year + 80;
			year += 1
		) {
			const sendDate = toIso(
				year,
				parsed.month,
				clampDay(year, parsed.month, parsed.day),
			);
			if (compareIso(sendDate, fromIso) < 0) continue;
			if (compareIso(sendDate, addDays(fromIso, 90)) > 0) break;
			const years = yearsOn(employee.anniversaryDate, sendDate);
			if (years == null || !marks.has(years)) continue;
			sends.push({
				id: `${template.id}:ceo:${employee.associateOID}:${sendDate}`,
				templateId: template.id,
				templateName: template.name,
				kind: template.kind,
				sendDate,
				sendAt: template.sendAt,
				recipientName: "CEO",
				recipientEmails: template.recipientEmails,
				summary: `${employee.displayName}, ${years} year${years === 1 ? "" : "s"}`,
				...rendered(template, {
					employeeName: employee.displayName,
					firstName: firstName(employee.displayName),
					date: formatDate(sendDate),
					years,
				}),
				employees: [
					{
						associateOID: employee.associateOID,
						displayName: employee.displayName,
						email: employee.email,
						milestoneType: "anniversary",
						date: employee.anniversaryDate ?? sendDate,
						years,
					},
				],
			});
			break;
		}
	}
	return sends;
}

function skipIdentity(templateId: number, person: UpcomingPerson) {
	return `${templateId}|${person.associateOID}|${person.milestoneType}|${person.date.slice(0, 10)}`;
}

function refreshMonthlySend(
	send: UpcomingSend,
	people: UpcomingPerson[],
	template: EmailTemplate | undefined,
	formatDate: (iso: string) => string,
): UpcomingSend {
	const month = /^\d+ milestones? in (.+)$/.exec(send.summary)?.[1];
	const summary = month
		? `${people.length} milestone${people.length === 1 ? "" : "s"} in ${month}`
		: send.summary;
	if (!template || !month) {
		return { ...send, employees: people, summary };
	}
	const values =
		template.kind === "manager_monthly"
			? {
					managerName: send.recipientName,
					month,
					count: people.length,
					employeeList: employeeListText(people, formatDate),
				}
			: {
					month,
					count: people.length,
					employeeList: employeeListText(people, formatDate),
				};
	return {
		...send,
		employees: people,
		summary,
		...rendered(template, values),
	};
}

export function applySendSkips(
	sends: UpcomingSend[],
	skips: SendSkipRef[],
	templates: EmailTemplate[],
	formatDate: (iso: string) => string,
): { sends: UpcomingSend[]; skipped: SkippedNote[] } {
	const skippedKeys = new Set(
		skips.map(
			(skip) =>
				`${skip.templateId}|${skip.associateOID}|${skip.milestoneType}|${skip.milestoneDate.slice(0, 10)}`,
		),
	);
	const templatesById = new Map(
		templates.map((template) => [template.id, template] as const),
	);
	const skipped: SkippedNote[] = [];
	const next: UpcomingSend[] = [];
	for (const send of sends) {
		const kept: UpcomingPerson[] = [];
		for (const person of send.employees) {
			if (!skippedKeys.has(skipIdentity(send.templateId, person))) {
				kept.push(person);
				continue;
			}
			skipped.push({
				templateId: send.templateId,
				templateName: send.templateName,
				kind: send.kind,
				associateOID: person.associateOID,
				displayName: person.displayName,
				milestoneType: person.milestoneType,
				milestoneDate: person.date.slice(0, 10),
				sendDate: send.sendDate,
				sendAt: send.sendAt,
			});
		}
		if (kept.length === send.employees.length) {
			next.push(send);
			continue;
		}
		if (!kept.length) continue;
		const monthly =
			send.kind === "manager_monthly" || send.kind === "ceo_monthly";
		next.push(
			monthly
				? refreshMonthlySend(
						send,
						kept,
						templatesById.get(send.templateId),
						formatDate,
					)
				: { ...send, employees: kept },
		);
	}
	return { sends: next, skipped };
}
