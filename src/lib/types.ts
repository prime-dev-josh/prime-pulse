export type MilestoneType = "anniversary" | "birthday";

export type TemplateKind =
	| "employee_day_of"
	| "manager_monthly"
	| "ceo_anniversary"
	| "ceo_monthly";

export type AnniversarySource = "originalHireDate" | "seniorityDate";

export type EmployeeRow = {
	associateOID: string;
	displayName: string;
	email: string | null;
	anniversaryDate: string | null;
	anniversarySource: AnniversarySource | null;
	birthDate: string | null;
	managerOID: string | null;
	managerName: string | null;
	managerEmail: string | null;
};

export type EmailTemplate = {
	id: number;
	name: string;
	kind: TemplateKind;
	milestoneTypes: MilestoneType[];
	daysBeforeMonthStart: number;
	anniversaryYears: number[];
	recipientEmails: string[];
	sendAt: string;
	emailSubject: string;
	emailBody: string;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
};

export type UpcomingPerson = {
	associateOID: string;
	displayName: string;
	email: string | null;
	milestoneType: MilestoneType;
	date: string;
	years: number | null;
};

export type UpcomingSend = {
	id: string;
	templateId: number;
	templateName: string;
	kind: TemplateKind;
	sendDate: string;
	sendAt: string;
	recipientName: string;
	recipientEmails: string[];
	summary: string;
	subjectPreview: string;
	bodyPreview: string;
	employees: UpcomingPerson[];
};

export const DEFAULT_ANNIVERSARY_YEARS = [1, 5, 10, 15, 20, 25, 30];
export const DEFAULT_SEND_AT = "09:00";

export const TEMPLATE_KIND_COPY: Record<
	TemplateKind,
	{ label: string; blurb: string }
> = {
	employee_day_of: {
		label: "Employee Milestone",
		blurb: "Sent to the employee on their birthday or work anniversary.",
	},
	manager_monthly: {
		label: "Manager Monthly Report",
		blurb:
			"Sent to each manager ahead of the month, listing their people's upcoming birthdays and anniversaries.",
	},
	ceo_anniversary: {
		label: "CEO Anniversary Marks",
		blurb:
			"Sent to the CEO on 1st, 5th, 10th, 15th, and other year marks you choose.",
	},
	ceo_monthly: {
		label: "CEO Monthly Digest",
		blurb:
			"Sent to the CEO ahead of the month, listing everyone's upcoming birthdays and anniversaries.",
	},
};

export function isCeoKind(kind: TemplateKind) {
	return kind === "ceo_anniversary" || kind === "ceo_monthly";
}

export function isMonthlyKind(kind: TemplateKind) {
	return kind === "manager_monthly" || kind === "ceo_monthly";
}

export const MILESTONE_ORDER: MilestoneType[] = ["birthday", "anniversary"];

export const MILESTONE_BADGE: Record<
	MilestoneType,
	{ label: string; className: string }
> = {
	birthday: {
		label: "Birthday",
		className: "bg-[var(--brand-orange)] text-white",
	},
	anniversary: {
		label: "Anniversary",
		className: "bg-[var(--brand-indigo)] text-white",
	},
};
