import {
	addDays,
	compareIso,
	parseIso,
	toIso,
	UNASSIGNED_MANAGER,
} from "#/lib/schedule";
import type {
	EmailTemplate,
	EmployeeRow,
	ReadinessGroup,
	UpcomingSend,
} from "#/lib/types";

const NAME_LIMIT = 8;

function daysInMonth(year: number, month: number) {
	return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function monthEnd(iso: string) {
	const parsed = parseIso(iso);
	if (!parsed) return iso;
	return toIso(
		parsed.year,
		parsed.month,
		daysInMonth(parsed.year, parsed.month),
	);
}

export function pulseStats(sends: UpcomingSend[], today: string) {
	const weekEnd = addDays(today, 6);
	const end = monthEnd(today);
	const nextSeven = sends.filter(
		(send) =>
			compareIso(send.sendDate, today) >= 0 &&
			compareIso(send.sendDate, weekEnd) <= 0,
	);
	const restOfMonth = sends.filter(
		(send) =>
			compareIso(send.sendDate, weekEnd) > 0 &&
			compareIso(send.sendDate, end) <= 0,
	);
	let birthdays = 0;
	let anniversaries = 0;
	for (const send of [...nextSeven, ...restOfMonth]) {
		for (const person of send.employees) {
			if (person.milestoneType === "birthday") birthdays += 1;
			else anniversaries += 1;
		}
	}
	return {
		nextSevenDays: nextSeven.length,
		restOfMonth: restOfMonth.length,
		birthdays,
		anniversaries,
		next: sends.slice(0, 3),
	};
}

function pushName(names: Map<string, string>, key: string, label: string) {
	if (!names.has(key)) names.set(key, label);
}

function group(
	id: ReadinessGroup["id"],
	title: string,
	detail: string,
	names: Map<string, string>,
): ReadinessGroup | null {
	if (!names.size) return null;
	return {
		id,
		title,
		detail,
		count: names.size,
		names: [...names.values()].slice(0, NAME_LIMIT),
	};
}

function templateCovers(
	template: EmailTemplate,
	type: "birthday" | "anniversary",
) {
	return template.enabled && template.milestoneTypes.includes(type);
}

export function readinessReport(
	templates: EmailTemplate[],
	employees: EmployeeRow[],
	sends: UpcomingSend[],
): ReadinessGroup[] {
	const byId = new Map(templates.map((template) => [template.id, template]));
	const missingEmail = new Map<string, string>();
	const missingManager = new Map<string, string>();

	for (const send of sends) {
		const template = byId.get(send.templateId);
		if (send.kind === "employee_day_of") {
			for (const person of send.employees) {
				if (person.email) continue;
				pushName(missingEmail, person.associateOID, person.displayName);
			}
			continue;
		}
		if (send.kind !== "manager_monthly" || !template) continue;
		const extras = new Set(
			template.recipientEmails.map((email) => email.toLowerCase()),
		);
		const managerHasEmail = send.recipientEmails.some(
			(email) => !extras.has(email.toLowerCase()),
		);
		if (send.recipientName === UNASSIGNED_MANAGER) {
			for (const person of send.employees) {
				pushName(missingManager, person.associateOID, person.displayName);
			}
			continue;
		}
		if (!managerHasEmail) {
			pushName(
				missingEmail,
				`manager:${send.recipientName}`,
				send.recipientName,
			);
		}
	}

	const wantsBirthday = templates.some((template) =>
		templateCovers(template, "birthday"),
	);
	const wantsAnniversary = templates.some((template) =>
		templateCovers(template, "anniversary"),
	);
	const missingDate = new Map<string, string>();
	if (wantsBirthday || wantsAnniversary) {
		for (const employee of employees) {
			const gaps: string[] = [];
			if (wantsBirthday && !employee.birthDate) gaps.push("birthday");
			if (wantsAnniversary && !employee.anniversaryDate)
				gaps.push("anniversary");
			if (!gaps.length) continue;
			pushName(
				missingDate,
				employee.associateOID,
				`${employee.displayName} · ${gaps.join(" and ")}`,
			);
		}
	}

	return [
		group(
			"missing-email",
			"Missing email",
			"These notes have nowhere to go.",
			missingEmail,
		),
		group(
			"missing-manager",
			"Missing manager",
			"These people would be left off the manager report.",
			missingManager,
		),
		group(
			"missing-date",
			"Missing milestone date",
			"Active people an enabled template could cover, with no date in ADP.",
			missingDate,
		),
	].filter((item): item is ReadinessGroup => item != null);
}
