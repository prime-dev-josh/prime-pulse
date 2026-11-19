import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Button,
	Checkbox,
	Field,
	Input,
	makeStyles,
	Textarea,
	tokens,
} from "@fluentui/react-components";
import { useMemo, useState } from "react";
import { AppShell } from "#/components/app-shell";
import { formatDate, formatSendAt, formatTimestamp, normalizeSendAt } from "#/lib/dates";
import { parseNotifyList } from "#/lib/notify";
import { PLACEHOLDERS } from "#/lib/schedule";
import type {
	EmailTemplate,
	MilestoneType,
	TemplateKind,
	UpcomingSend,
} from "#/lib/types";
import {
	DEFAULT_ANNIVERSARY_YEARS,
	DEFAULT_SEND_AT,
	isCeoKind,
	isMonthlyKind,
	TEMPLATE_KIND_COPY,
} from "#/lib/types";
import { actionErrorMessage, toastAction, toastError } from "#/lib/toast";
import {
	getTemplates,
	getUpcoming,
	removeEmailTemplate,
	saveEmailTemplate,
} from "#/server/functions";

type FormState = {
	id?: number;
	name: string;
	kind: TemplateKind;
	milestoneTypes: MilestoneType[];
	daysBeforeMonthStart: number;
	anniversaryYearsText: string;
	recipientText: string;
	sendAt: string;
	emailSubject: string;
	emailBody: string;
	enabled: boolean;
};

const KINDS: TemplateKind[] = [
	"employee_day_of",
	"manager_monthly",
	"ceo_anniversary",
	"ceo_monthly",
];

const useStyles = makeStyles({
	page: {
		display: "flex",
		flex: 1,
		flexDirection: "column",
		gap: "16px",
		minHeight: 0,
		overflow: "hidden",
	},
	kinds: {
		display: "grid",
		flexShrink: 0,
		gap: "12px",
		gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
	},
	kind: {
		padding: "16px",
		textAlign: "left",
		cursor: "pointer",
		borderRadius: tokens.borderRadiusXLarge,
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		backgroundColor: tokens.colorNeutralBackground1,
		color: tokens.colorNeutralForeground1,
	},
	kindOn: {
		border: `1px solid ${tokens.colorBrandStroke1}`,
	},
	title: {
		margin: 0,
		fontWeight: tokens.fontWeightSemibold,
	},
	muted: {
		margin: "4px 0 0",
		color: tokens.colorNeutralForeground3,
		fontSize: tokens.fontSizeBase200,
	},
	panel: {
		display: "flex",
		flex: 1,
		flexDirection: "column",
		minHeight: 0,
		overflow: "hidden",
		borderRadius: tokens.borderRadiusXLarge,
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		backgroundColor: tokens.colorNeutralBackground1,
	},
	listHead: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: "12px",
		padding: "16px 20px",
		borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
	},
	scroll: {
		flex: 1,
		minHeight: 0,
		overflow: "auto",
		padding: "16px",
		display: "flex",
		flexDirection: "column",
		gap: "12px",
	},
	card: {
		padding: "16px",
		borderRadius: tokens.borderRadiusXLarge,
		border: `1px solid ${tokens.colorNeutralStroke2}`,
	},
	cardHead: {
		display: "flex",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: "12px",
	},
	cardFoot: {
		display: "flex",
		flexWrap: "wrap",
		alignItems: "center",
		justifyContent: "space-between",
		gap: "12px",
		marginTop: "16px",
	},
	actions: {
		display: "flex",
		flexWrap: "wrap",
		gap: "8px",
	},
	formBody: {
		display: "flex",
		flex: 1,
		flexDirection: "column",
		gap: "16px",
		minHeight: 0,
		overflow: "auto",
		padding: "20px",
	},
	tokens: {
		display: "flex",
		flexWrap: "wrap",
		gap: "6px",
	},
	formFoot: {
		display: "flex",
		flexWrap: "wrap",
		alignItems: "center",
		gap: "12px",
		padding: "16px 20px",
		borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
	},
	checks: {
		display: "flex",
		flexWrap: "wrap",
		gap: "12px",
		margin: 0,
		padding: 0,
		border: "none",
		"& legend": {
			width: "100%",
			padding: 0,
			fontSize: tokens.fontSizeBase300,
			fontWeight: tokens.fontWeightSemibold,
		},
	},
	error: {
		margin: 0,
		color: tokens.colorPaletteRedForeground1,
		fontSize: tokens.fontSizeBase200,
	},
});

function defaultSubject(kind: TemplateKind) {
	if (kind === "employee_day_of")
		return "Happy {{milestoneType}}, {{firstName}}";
	if (kind === "manager_monthly" || kind === "ceo_monthly")
		return "Upcoming milestones in {{month}}";
	return "{{employeeName}} is marking {{years}} years at Prime AE";
}

function defaultBody(kind: TemplateKind) {
	if (kind === "employee_day_of") {
		return "Hi {{firstName}},\n\nEveryone at Prime AE is wishing you a great {{milestoneType}} on {{date}}.\n\nThank you for being part of the team.";
	}
	if (kind === "manager_monthly") {
		return "Hi {{managerName}},\n\nThese teammates have birthdays or anniversaries in {{month}}:\n\n{{employeeList}}\n\nPlease plan notes and check-ins.";
	}
	if (kind === "ceo_monthly") {
		return "These teammates have birthdays or anniversaries in {{month}}:\n\n{{employeeList}}";
	}
	return "{{employeeName}} reaches {{years}} years with Prime AE on {{date}}.";
}

function emptyForm(kind: TemplateKind = "employee_day_of"): FormState {
	return {
		name: "",
		kind,
		milestoneTypes:
			kind === "ceo_anniversary"
				? ["anniversary"]
				: ["anniversary", "birthday"],
		daysBeforeMonthStart: 14,
		anniversaryYearsText: DEFAULT_ANNIVERSARY_YEARS.join(", "),
		recipientText: "",
		sendAt: DEFAULT_SEND_AT,
		emailSubject: defaultSubject(kind),
		emailBody: defaultBody(kind),
		enabled: true,
	};
}

function parseYears(text: string) {
	const years = text
		.split(/[\s,;]+/)
		.map((part) => Number(part))
		.filter((value) => Number.isInteger(value) && value >= 1 && value <= 80);
	return [...new Set(years)].sort((a, b) => a - b);
}

function yearsLabel(years: number[]) {
	if (!years.length) return "No year marks";
	return years.map((year) => `${year}${ordinal(year)}`).join(", ");
}

function ordinal(value: number) {
	const ones = value % 10;
	const tens = value % 100;
	if (tens >= 11 && tens <= 13) return "th";
	if (ones === 1) return "st";
	if (ones === 2) return "nd";
	if (ones === 3) return "rd";
	return "th";
}

function ruleSummary(template: EmailTemplate) {
	const types = template.milestoneTypes.join(" and ");
	const at = `at ${formatSendAt(template.sendAt)} ET`;
	if (template.kind === "employee_day_of") {
		return `To the employee, on the day of their ${types}, ${at}.`;
	}
	if (isMonthlyKind(template.kind)) {
		const lead =
			template.daysBeforeMonthStart === 0
				? "on the first of the month"
				: `${template.daysBeforeMonthStart} day${template.daysBeforeMonthStart === 1 ? "" : "s"} before the first of the month`;
		if (template.kind === "ceo_monthly") {
			return `To the CEO, ${lead}, ${at}, for ${types} across the company in the coming month.`;
		}
		return `To each manager, ${lead}, ${at}, for ${types} in the coming month.`;
	}
	return `To the CEO on ${yearsLabel(template.anniversaryYears)} work anniversaries, ${at}.`;
}

function copyName(name: string, existing: string[]) {
	const taken = new Set(existing.map((item) => item.toLowerCase()));
	const base = name.trim();
	let candidate = `${base} copy`.slice(0, 200);
	if (!taken.has(candidate.toLowerCase())) return candidate;
	for (let index = 2; index < 100; index += 1) {
		const suffix = ` copy ${index}`;
		candidate = `${base.slice(0, 200 - suffix.length)}${suffix}`;
		if (!taken.has(candidate.toLowerCase())) return candidate;
	}
	return candidate;
}

function nextSendLine(
	template: EmailTemplate,
	sends: UpcomingSend[] | undefined,
) {
	if (!template.enabled) return "Paused. No notes are scheduled.";
	if (!sends) return "Checking the next send…";
	const mine = sends.filter((send) => send.templateId === template.id);
	if (!mine.length) return "No notes in this preview window.";
	const next = mine[0];
	const count = `${mine.length} note${mine.length === 1 ? "" : "s"}`;
	return `Next ${formatDate(next.sendDate)} at ${formatSendAt(next.sendAt)} ET · ${count}`;
}

function templatePayload(template: EmailTemplate, enabled: boolean) {
	return {
		id: template.id,
		name: template.name,
		kind: template.kind,
		milestoneTypes:
			template.kind === "ceo_anniversary"
				? (["anniversary"] as const)
				: template.milestoneTypes,
		daysBeforeMonthStart: template.daysBeforeMonthStart,
		anniversaryYears:
			template.kind === "ceo_anniversary" ? template.anniversaryYears : [],
		recipientEmails: template.recipientEmails,
		sendAt: normalizeSendAt(template.sendAt),
		emailSubject: template.emailSubject,
		emailBody: template.emailBody,
		enabled,
	};
}

export function TemplatesScreen() {
	const styles = useStyles();
	const queryClient = useQueryClient();
	const templates = useQuery({
		queryKey: ["templates"],
		queryFn: () => getTemplates(),
		retry: false,
	});
	const upcoming = useQuery({
		queryKey: ["upcoming"],
		queryFn: () => getUpcoming(),
		retry: false,
	});
	const [form, setForm] = useState<FormState>(emptyForm());
	const [panel, setPanel] = useState<"list" | "form">("list");
	const { emails, invalid } = parseNotifyList(form.recipientText);
	const years = parseYears(form.anniversaryYearsText);
	const canSave =
		form.name.trim().length > 0 &&
		form.emailSubject.trim().length > 0 &&
		form.emailBody.trim().length > 0 &&
		/^\d{2}:\d{2}$/.test(normalizeSendAt(form.sendAt)) &&
		form.milestoneTypes.length > 0 &&
		invalid.length === 0 &&
		(!isCeoKind(form.kind) || emails.length > 0) &&
		(form.kind !== "ceo_anniversary" || years.length > 0);

	const grouped = useMemo(() => {
		const groups: Record<TemplateKind, EmailTemplate[]> = {
			employee_day_of: [],
			manager_monthly: [],
			ceo_anniversary: [],
			ceo_monthly: [],
		};
		for (const template of templates.data ?? []) {
			groups[template.kind].push(template);
		}
		return groups;
	}, [templates.data]);
	const visibleTemplates = grouped[form.kind] ?? [];

	async function refresh() {
		await queryClient.invalidateQueries({ queryKey: ["templates"] });
		await queryClient.invalidateQueries({ queryKey: ["upcoming"] });
	}

	const save = useMutation({
		mutationFn: () =>
			saveEmailTemplate({
				data: {
					id: form.id,
					name: form.name.trim(),
					kind: form.kind,
					milestoneTypes:
						form.kind === "ceo_anniversary"
							? ["anniversary"]
							: form.milestoneTypes,
					daysBeforeMonthStart: form.daysBeforeMonthStart,
					anniversaryYears: form.kind === "ceo_anniversary" ? years : [],
					recipientEmails: emails,
					sendAt: normalizeSendAt(form.sendAt),
					emailSubject: form.emailSubject.trim(),
					emailBody: form.emailBody.trim(),
					enabled: form.enabled,
				},
			}),
		onSuccess: async () => {
			toastAction(form.id == null ? "Template saved." : "Template updated.");
			setForm(emptyForm(form.kind));
			setPanel("list");
			await refresh();
		},
		onError: (error) => {
			toastError(actionErrorMessage(error, "Could not save the template"));
		},
	});

	const toggleEnabled = useMutation({
		mutationFn: ({
			template,
			enabled,
		}: {
			template: EmailTemplate;
			enabled: boolean;
		}) => saveEmailTemplate({ data: templatePayload(template, enabled) }),
		onSuccess: async (_, { template, enabled }) => {
			toastAction(
				enabled
					? `${template.name} is ready to use.`
					: `${template.name} is paused.`,
			);
			if (form.id === template.id) {
				setForm((current) => ({ ...current, enabled }));
			}
			await refresh();
		},
		onError: (error) => {
			toastError(actionErrorMessage(error, "Could not update this template"));
		},
	});

	const remove = useMutation({
		mutationFn: (id: number) => removeEmailTemplate({ data: { id } }),
		onSuccess: async (_, id) => {
			const name =
				templates.data?.find((item) => item.id === id)?.name ?? "Template";
			toastAction(`${name} removed.`);
			if (form.id === id) {
				setForm(emptyForm(form.kind));
				setPanel("list");
			}
			await refresh();
		},
		onError: (error) => {
			toastError(actionErrorMessage(error, "Could not remove the template"));
		},
	});

	function showList(kind: TemplateKind = form.kind) {
		setForm(emptyForm(kind));
		setPanel("list");
	}

	function startNew() {
		setForm(emptyForm(form.kind));
		setPanel("form");
	}

	function duplicate(template: EmailTemplate) {
		const names = (templates.data ?? []).map((item) => item.name);
		setForm({
			name: copyName(template.name, names),
			kind: template.kind,
			milestoneTypes: template.milestoneTypes,
			daysBeforeMonthStart: template.daysBeforeMonthStart,
			anniversaryYearsText: template.anniversaryYears.join(", "),
			recipientText: template.recipientEmails.join("\n"),
			sendAt: normalizeSendAt(template.sendAt),
			emailSubject: template.emailSubject,
			emailBody: template.emailBody,
			enabled: template.enabled,
		});
		setPanel("form");
	}

	function edit(template: EmailTemplate) {
		setForm({
			id: template.id,
			name: template.name,
			kind: template.kind,
			milestoneTypes: template.milestoneTypes,
			daysBeforeMonthStart: template.daysBeforeMonthStart,
			anniversaryYearsText: template.anniversaryYears.join(", "),
			recipientText: template.recipientEmails.join("\n"),
			sendAt: normalizeSendAt(template.sendAt),
			emailSubject: template.emailSubject,
			emailBody: template.emailBody,
			enabled: template.enabled,
		});
		setPanel("form");
	}

	function toggleType(type: MilestoneType) {
		setForm((current) => {
			const has = current.milestoneTypes.includes(type);
			const milestoneTypes = has
				? current.milestoneTypes.filter((item) => item !== type)
				: [...current.milestoneTypes, type];
			return { ...current, milestoneTypes };
		});
	}

	function insertToken(token: string) {
		setForm((current) => ({
			...current,
			emailBody: `${current.emailBody}${current.emailBody.endsWith(" ") || current.emailBody.length === 0 ? "" : " "}${token}`,
		}));
	}

	const recipientHint =
		form.kind === "employee_day_of"
			? "The employee work email is always To. These addresses are copied."
			: form.kind === "manager_monthly"
				? "Each manager is To, from ADP reports-to. These addresses are copied on every report."
				: form.kind === "ceo_monthly"
					? "Required. One digest covering the whole company. One address per line."
					: "Required. One address per line.";

	return (
		<AppShell
			heading="Email templates"
			title="Write the notes Prime Pulse will send. Nothing is mailed yet; Upcoming shows who would get each one."
		>
			<div className={styles.page}>
				<section className={styles.kinds}>
					{KINDS.map((kind) => (
						<button
							key={kind}
							type="button"
							aria-pressed={form.kind === kind}
							onClick={() => showList(kind)}
							className={`${styles.kind} ${form.kind === kind ? styles.kindOn : ""}`}
						>
							<p className={styles.title}>{TEMPLATE_KIND_COPY[kind].label}</p>
							<p className={styles.muted}>{TEMPLATE_KIND_COPY[kind].blurb}</p>
						</button>
					))}
				</section>

				{panel === "list" ? (
					<section className={styles.panel}>
						<div className={styles.listHead}>
							<div>
								<h2 className={styles.title}>
									{TEMPLATE_KIND_COPY[form.kind].label}
								</h2>
								<p className={styles.muted}>
									{TEMPLATE_KIND_COPY[form.kind].blurb}
								</p>
							</div>
							<Button appearance="primary" onClick={startNew}>
								New template
							</Button>
						</div>
						<div className={styles.scroll}>
							{templates.isPending ? (
								<p className={styles.muted}>Loading templates…</p>
							) : null}
							{templates.isError ? (
								<div>
									<p className={styles.error} role="alert">
										{templates.error instanceof Error
											? templates.error.message
											: "Could not load templates"}
									</p>
									<Button
										appearance="secondary"
										onClick={() => templates.refetch()}
									>
										Try again
									</Button>
								</div>
							) : null}
							{templates.data ? (
								visibleTemplates.length === 0 ? (
									<div className={styles.card}>
										<p className={styles.muted}>
											No {TEMPLATE_KIND_COPY[form.kind].label} templates yet.
										</p>
										<Button appearance="primary" onClick={startNew}>
											New template
										</Button>
									</div>
								) : (
									visibleTemplates.map((template) => (
										<article key={template.id} className={styles.card}>
											<div className={styles.cardHead}>
												<div>
													<h3 className={styles.title}>{template.name}</h3>
													<p className={styles.muted}>{template.emailSubject}</p>
													<p className={styles.muted}>{ruleSummary(template)}</p>
													<p className={styles.title}>
														{nextSendLine(template, upcoming.data?.sends)}
													</p>
												</div>
												<Button
													size="small"
													appearance={template.enabled ? "primary" : "outline"}
													aria-pressed={template.enabled}
													aria-label={
														template.enabled
															? `Pause ${template.name}`
															: `Turn on ${template.name}`
													}
													disabled={
														toggleEnabled.isPending &&
														toggleEnabled.variables?.template.id === template.id
													}
													onClick={() =>
														toggleEnabled.mutate({
															template,
															enabled: !template.enabled,
														})
													}
												>
													{template.enabled ? "Ready to use" : "Paused"}
												</Button>
											</div>
											<div className={styles.cardFoot}>
												<p className={styles.muted}>
													Updated {formatTimestamp(template.updatedAt)}
												</p>
												<div className={styles.actions}>
													<Button
														size="small"
														appearance="secondary"
														onClick={() => duplicate(template)}
													>
														Duplicate
													</Button>
													<Button
														size="small"
														appearance="secondary"
														onClick={() => edit(template)}
													>
														Edit
													</Button>
													<Button
														size="small"
														appearance="subtle"
														disabled={remove.isPending}
														onClick={() => remove.mutate(template.id)}
													>
														Remove
													</Button>
												</div>
											</div>
										</article>
									))
								)
							) : null}
						</div>
					</section>
				) : (
					<form
						className={styles.panel}
						onSubmit={(event) => {
							event.preventDefault();
							if (canSave && !save.isPending) save.mutate();
						}}
					>
						<div className={styles.formBody}>
							<div>
								<h2 className={styles.title}>
									{form.id == null ? "New template" : "Edit template"}
								</h2>
								<p className={styles.muted}>
									{TEMPLATE_KIND_COPY[form.kind].blurb}
								</p>
							</div>
							<Field label="Name" required>
								<Input
									value={form.name}
									onChange={(_, data) => setForm({ ...form, name: data.value })}
								/>
							</Field>
							<Field
								label="Send at"
								hint="Time of day in Eastern Time. The note goes out at this time on the send date."
								required
							>
								<Input
									type="time"
									step={60}
									value={form.sendAt}
									onChange={(_, data) =>
										setForm({
											...form,
											sendAt: normalizeSendAt(data.value),
										})
									}
									style={{ maxWidth: "12rem" }}
									required
								/>
							</Field>
							{form.kind !== "ceo_anniversary" ? (
								<fieldset className={styles.checks}>
									<legend>Milestones</legend>
									{(["birthday", "anniversary"] as const).map((type) => (
										<Checkbox
											key={type}
											label={type === "birthday" ? "Birthday" : "Anniversary"}
											checked={form.milestoneTypes.includes(type)}
											onChange={() => toggleType(type)}
										/>
									))}
								</fieldset>
							) : null}
							{isMonthlyKind(form.kind) ? (
								<Field
									label="Send this many days before the first of the month"
									hint="14 means the December report goes out on November 17. 0 sends on the first of the month."
								>
									<Input
										type="number"
										min={0}
										max={28}
										value={String(form.daysBeforeMonthStart)}
										onChange={(_, data) =>
											setForm({
												...form,
												daysBeforeMonthStart: Number(data.value) || 0,
											})
										}
									/>
								</Field>
							) : null}
							{form.kind === "ceo_anniversary" ? (
								<Field
									label="Year marks"
									hint="The CEO note sends only on these work-anniversary years."
								>
									<Input
										value={form.anniversaryYearsText}
										placeholder="1, 5, 10, 15, 20, 25, 30"
										onChange={(_, data) =>
											setForm({
												...form,
												anniversaryYearsText: data.value,
											})
										}
									/>
								</Field>
							) : null}
							<Field
								label={
									isCeoKind(form.kind)
										? "CEO email"
										: form.kind === "manager_monthly"
											? "Extra recipients"
											: "CC"
								}
								hint={recipientHint}
								validationState={invalid.length > 0 ? "error" : "none"}
								validationMessage={
									invalid.length > 0 ? `Not an email: ${invalid.join(", ")}` : undefined
								}
							>
								<Textarea
									value={form.recipientText}
									placeholder={
										isCeoKind(form.kind)
											? "ceo@primeae.com"
											: "optional extra addresses"
									}
									onChange={(_, data) =>
										setForm({ ...form, recipientText: data.value })
									}
									resize="vertical"
								/>
							</Field>
							<Field label="Subject" required>
								<Input
									value={form.emailSubject}
									onChange={(_, data) =>
										setForm({ ...form, emailSubject: data.value })
									}
								/>
							</Field>
							<Field label="Body" required>
								<div className={styles.tokens}>
									{PLACEHOLDERS[form.kind].map((item) => (
										<Button
											key={item.token}
											type="button"
											size="small"
											appearance="outline"
											title={item.meaning}
											onClick={() => insertToken(item.token)}
										>
											{item.token}
										</Button>
									))}
								</div>
								<Textarea
									value={form.emailBody}
									onChange={(_, data) =>
										setForm({ ...form, emailBody: data.value })
									}
									resize="vertical"
									style={{ minHeight: "10rem" }}
								/>
							</Field>
						</div>
						<div className={styles.formFoot}>
							<Checkbox
								label="Use this template in Upcoming"
								checked={form.enabled}
								onChange={(_, data) =>
									setForm({ ...form, enabled: Boolean(data.checked) })
								}
							/>
							<div className={styles.actions}>
								<Button
									type="button"
									appearance="secondary"
									onClick={() => showList()}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									appearance="primary"
									disabled={!canSave || save.isPending}
								>
									{save.isPending ? "Saving…" : "Save template"}
								</Button>
							</div>
						</div>
					</form>
				)}
			</div>
		</AppShell>
	);
}
