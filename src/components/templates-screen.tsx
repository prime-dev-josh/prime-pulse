import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "#/components/app-shell";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { formatSendAt, formatTimestamp, normalizeSendAt } from "#/lib/dates";
import { parseNotifyList } from "#/lib/notify";
import { PLACEHOLDERS } from "#/lib/schedule";
import type { EmailTemplate, MilestoneType, TemplateKind } from "#/lib/types";
import {
	DEFAULT_ANNIVERSARY_YEARS,
	DEFAULT_SEND_AT,
	TEMPLATE_KIND_COPY,
	isCeoKind,
	isMonthlyKind,
} from "#/lib/types";
import {
	getTemplates,
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

export function TemplatesScreen() {
	const queryClient = useQueryClient();
	const templates = useQuery({
		queryKey: ["templates"],
		queryFn: () => getTemplates(),
		retry: false,
	});
	const [form, setForm] = useState<FormState>(emptyForm());
	const [panel, setPanel] = useState<"list" | "form">("list");
	const [notice, setNotice] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

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
			setNotice(form.id == null ? "Template saved." : "Template updated.");
			setActionError(null);
			setForm(emptyForm(form.kind));
			setPanel("list");
			await refresh();
		},
		onError: (error) => {
			setActionError(
				error instanceof Error ? error.message : "Could not save the template",
			);
		},
	});

	const remove = useMutation({
		mutationFn: (id: number) => removeEmailTemplate({ data: { id } }),
		onSuccess: async (_, id) => {
			setNotice("Template removed.");
			setActionError(null);
			if (form.id === id) {
				setForm(emptyForm(form.kind));
				setPanel("list");
			}
			await refresh();
		},
		onError: (error) => {
			setActionError(
				error instanceof Error
					? error.message
					: "Could not remove the template",
			);
		},
	});

	function showList(kind: TemplateKind = form.kind) {
		setForm(emptyForm(kind));
		setPanel("list");
		setActionError(null);
	}

	function startNew() {
		setForm(emptyForm(form.kind));
		setPanel("form");
		setActionError(null);
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
		setActionError(null);
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

	return (
		<AppShell
			heading="Email templates"
			title="Write the notes Prime Pulse will send. Nothing is mailed yet; Upcoming shows who would get each one."
		>
			<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
			<section className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{KINDS.map((kind) => (
					<button
						key={kind}
						type="button"
						aria-pressed={form.kind === kind}
						onClick={() => showList(kind)}
						className={`rounded-xl border p-4 text-left shadow-sm transition-colors ${
							form.kind === kind
								? "border-[var(--brand-orange)] bg-white"
								: "border-[var(--line)] bg-white/80 hover:border-[var(--brand-indigo)]/40"
						}`}
					>
						<p className="text-sm font-semibold text-[var(--brand-ink)]">
							{TEMPLATE_KIND_COPY[kind].label}
						</p>
						<p className="mt-1 text-sm text-[var(--brand-indigo-light)]">
							{TEMPLATE_KIND_COPY[kind].blurb}
						</p>
					</button>
				))}
			</section>

			{notice ? (
				<output className="block shrink-0 rounded-lg border border-[var(--brand-indigo)]/20 bg-white px-4 py-3 text-sm text-[var(--brand-indigo)]">
					{notice}
				</output>
			) : null}
			{actionError ? (
				<p
					className="shrink-0 rounded-lg border border-destructive/30 bg-white px-4 py-3 text-sm text-destructive"
					role="alert"
				>
					{actionError}
				</p>
			) : null}

			{panel === "list" ? (
				<section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-sm">
					<div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
						<div>
							<h2 className="text-lg font-semibold text-[var(--brand-ink)]">
								{TEMPLATE_KIND_COPY[form.kind].label}
							</h2>
							<p className="mt-0.5 text-sm text-[var(--sea-ink-soft)]">
								{TEMPLATE_KIND_COPY[form.kind].blurb}
							</p>
						</div>
						<Button type="button" onClick={startNew}>
							New template
						</Button>
					</div>
					<div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
					{templates.isPending ? (
						<p className="text-sm text-[var(--sea-ink-soft)]">
							Loading templates…
						</p>
					) : null}
					{templates.isError ? (
						<div className="space-y-3">
							<p className="text-sm text-destructive" role="alert">
								{templates.error instanceof Error
									? templates.error.message
									: "Could not load templates"}
							</p>
							<Button variant="outline" onClick={() => templates.refetch()}>
								Try again
							</Button>
						</div>
					) : null}
					{templates.data ? (
						visibleTemplates.length === 0 ? (
							<div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--brand-tint-25)] p-6 text-sm text-[var(--sea-ink-soft)]">
								<p>
									No {TEMPLATE_KIND_COPY[form.kind].label} templates yet.
								</p>
								<Button type="button" className="mt-4" onClick={startNew}>
									New template
								</Button>
							</div>
						) : (
							visibleTemplates.map((template) => (
								<article
									key={template.id}
									className="rounded-xl border border-[var(--line)] p-4 shadow-sm"
								>
									<div className="flex items-start justify-between gap-3">
										<div>
											<h3 className="font-semibold text-[var(--sea-ink)]">
												{template.name}
											</h3>
											<p className="mt-1 text-sm">{template.emailSubject}</p>
											<p className="mt-2 text-sm text-[var(--brand-indigo-light)]">
												{ruleSummary(template)}
											</p>
										</div>
										<Badge variant={template.enabled ? "saved" : "outline"}>
											{template.enabled ? "On" : "Paused"}
										</Badge>
									</div>
									<div className="mt-4 flex items-center justify-between gap-3">
										<p className="text-xs text-[var(--sea-ink-soft)]">
											Updated {formatTimestamp(template.updatedAt)}
										</p>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => edit(template)}
											>
												Edit
											</Button>
											<Button
												size="sm"
												variant="ghost"
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
					className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-sm"
					onSubmit={(event) => {
						event.preventDefault();
						if (canSave && !save.isPending) save.mutate();
					}}
				>
					<div className="min-h-0 flex-1 space-y-4 overflow-auto p-5">
					<div>
						<h2 className="text-2xl font-semibold text-[var(--brand-ink)]">
							{form.id == null ? "New template" : "Edit template"}
						</h2>
						<p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
							{TEMPLATE_KIND_COPY[form.kind].blurb}
						</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="template-name">Name</Label>
						<Input
							id="template-name"
							value={form.name}
							onChange={(event) =>
								setForm({ ...form, name: event.target.value })
							}
							className="bg-white"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="send-at">Send at</Label>
						<Input
							id="send-at"
							type="time"
							step={60}
							value={form.sendAt}
							onChange={(event) =>
								setForm({
									...form,
									sendAt: normalizeSendAt(event.target.value),
								})
							}
							className="max-w-48 bg-white"
							required
						/>
						<p className="text-xs text-[var(--sea-ink-soft)]">
							Time of day in Eastern Time. The note goes out at this time on the
							send date.
						</p>
					</div>
					{form.kind !== "ceo_anniversary" ? (
						<fieldset className="space-y-2">
							<legend className="text-sm font-medium">Milestones</legend>
							{(["birthday", "anniversary"] as const).map((type) => (
								<label
									key={type}
									className="flex items-center gap-2 text-sm capitalize"
								>
									<input
										type="checkbox"
										className="size-4 accent-[var(--brand-indigo)]"
										checked={form.milestoneTypes.includes(type)}
										onChange={() => toggleType(type)}
									/>
									{type}
								</label>
							))}
						</fieldset>
					) : null}
					{isMonthlyKind(form.kind) ? (
						<div className="space-y-2">
							<Label htmlFor="lead-days">
								Send this many days before the first of the month
							</Label>
							<Input
								id="lead-days"
								type="number"
								min={0}
								max={28}
								value={form.daysBeforeMonthStart}
								onChange={(event) =>
									setForm({
										...form,
										daysBeforeMonthStart: Number(event.target.value) || 0,
									})
								}
								className="bg-white"
							/>
							<p className="text-xs text-[var(--sea-ink-soft)]">
								14 means the December report goes out on November 17. 0 sends on
								the first of the month.
							</p>
						</div>
					) : null}
					{form.kind === "ceo_anniversary" ? (
						<div className="space-y-2">
							<Label htmlFor="year-marks">Year marks</Label>
							<Input
								id="year-marks"
								value={form.anniversaryYearsText}
								onChange={(event) =>
									setForm({
										...form,
										anniversaryYearsText: event.target.value,
									})
								}
								placeholder="1, 5, 10, 15, 20, 25, 30"
								className="bg-white"
							/>
							<p className="text-xs text-[var(--sea-ink-soft)]">
								The CEO note sends only on these work-anniversary years.
							</p>
						</div>
					) : null}
					<div className="space-y-2">
						<Label htmlFor="recipients">
							{isCeoKind(form.kind)
								? "CEO email"
								: form.kind === "manager_monthly"
									? "Extra recipients"
									: "CC"}
						</Label>
						<Textarea
							id="recipients"
							value={form.recipientText}
							onChange={(event) =>
								setForm({ ...form, recipientText: event.target.value })
							}
							placeholder={
								isCeoKind(form.kind)
									? "ceo@primeae.com"
									: "optional extra addresses"
							}
							className="min-h-20 bg-white"
						/>
						<p className="text-xs text-[var(--sea-ink-soft)]">
							{form.kind === "employee_day_of"
								? "The employee work email is always To. These addresses are copied."
								: form.kind === "manager_monthly"
									? "Each manager is To, from ADP reports-to. These addresses are copied on every report."
									: form.kind === "ceo_monthly"
										? "Required. One digest covering the whole company. One address per line."
										: "Required. One address per line."}
						</p>
						{invalid.length > 0 ? (
							<p className="text-xs text-destructive">
								Not an email: {invalid.join(", ")}
							</p>
						) : null}
					</div>
					<div className="space-y-2">
						<Label htmlFor="template-subject">Subject</Label>
						<Input
							id="template-subject"
							value={form.emailSubject}
							onChange={(event) =>
								setForm({ ...form, emailSubject: event.target.value })
							}
							className="bg-white"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="template-body">Body</Label>
						<div className="flex flex-wrap gap-1">
							{PLACEHOLDERS[form.kind].map((item) => (
								<button
									key={item.token}
									type="button"
									title={item.meaning}
									className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--brand-indigo)] hover:border-[var(--brand-orange)]"
									onClick={() => insertToken(item.token)}
								>
									{item.token}
								</button>
							))}
						</div>
						<Textarea
							id="template-body"
							value={form.emailBody}
							onChange={(event) =>
								setForm({ ...form, emailBody: event.target.value })
							}
							className="min-h-40 bg-white"
						/>
					</div>
					</div>
					<div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-[var(--line)] bg-white px-5 py-4">
					<label className="mr-auto flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							className="size-4 accent-[var(--brand-indigo)]"
							checked={form.enabled}
							onChange={(event) =>
								setForm({ ...form, enabled: event.target.checked })
							}
						/>
						Use this template in Upcoming
					</label>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => showList()}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!canSave || save.isPending}>
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
