import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, List } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "#/components/app-shell";
import { EmailPreviewDialog } from "#/components/email-preview-dialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { UpcomingCalendar } from "#/components/upcoming-calendar";
import { formatDate, formatSendAt } from "#/lib/dates";
import { todayIso } from "#/lib/schedule";
import type {
	SkippedNote,
	TemplateKind,
	UpcomingPerson,
	UpcomingSend,
} from "#/lib/types";
import { isCeoKind, TEMPLATE_KIND_COPY } from "#/lib/types";
import { actionErrorMessage, toastAction, toastError } from "#/lib/toast";
import { cn } from "#/lib/utils";
import { getUpcoming, skipPerson, undoSkip } from "#/server/functions";

const filters: Array<{
	id: "all" | "ceo" | TemplateKind;
	label: string;
}> = [
	{ id: "all", label: "All" },
	{ id: "employee_day_of", label: "Employee" },
	{ id: "manager_monthly", label: "Manager" },
	{ id: "ceo", label: "CEO" },
];

function csvCell(value: string) {
	if (/[",\r\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
	return value;
}

function downloadCsv(rows: UpcomingSend[]) {
	const header = [
		"Send date",
		"Time",
		"Template",
		"Kind",
		"Recipient",
		"Emails",
		"Summary",
	];
	const lines = [
		header,
		...rows.map((send) => [
			send.sendDate,
			formatSendAt(send.sendAt),
			send.templateName,
			TEMPLATE_KIND_COPY[send.kind].label,
			send.recipientName,
			send.recipientEmails.join("; "),
			send.summary,
		]),
	];
	const csv = lines.map((line) => line.map(csvCell).join(",")).join("\r\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = "prime-pulse-upcoming.csv";
	anchor.click();
	URL.revokeObjectURL(url);
}

function matchesKind(
	kind: (typeof filters)[number]["id"],
	sendKind: TemplateKind,
) {
	if (kind === "all") return true;
	if (kind === "ceo") return isCeoKind(sendKind);
	return sendKind === kind;
}

export function UpcomingScreen({ initialDate }: { initialDate?: string }) {
	const queryClient = useQueryClient();
	const upcoming = useQuery({
		queryKey: ["upcoming"],
		queryFn: () => getUpcoming(),
		retry: false,
	});
	const [search, setSearch] = useState("");
	const [kind, setKind] = useState<(typeof filters)[number]["id"]>("all");
	const [view, setView] = useState<"list" | "calendar">("list");
	const [openId, setOpenId] = useState<string | null>(null);
	const [preview, setPreview] = useState<UpcomingSend | null>(null);
	const [selectedDay, setSelectedDay] = useState(initialDate ?? todayIso());
	const today = upcoming.data?.today ?? todayIso();

	useEffect(() => {
		if (initialDate) setSelectedDay(initialDate);
	}, [initialDate]);

	const rows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return (upcoming.data?.sends ?? []).filter((send) => {
			if (!matchesKind(kind, send.kind)) return false;
			if (!query) return true;
			return (
				send.templateName.toLowerCase().includes(query) ||
				send.recipientName.toLowerCase().includes(query) ||
				send.subjectPreview.toLowerCase().includes(query) ||
				send.employees.some((person) =>
					person.displayName.toLowerCase().includes(query),
				)
			);
		});
	}, [kind, search, upcoming.data]);

	const skipped = useMemo(() => {
		const query = search.trim().toLowerCase();
		return (upcoming.data?.skipped ?? []).filter((note) => {
			if (!matchesKind(kind, note.kind)) return false;
			if (view === "calendar" && note.sendDate !== selectedDay) return false;
			if (!query) return true;
			return (
				note.templateName.toLowerCase().includes(query) ||
				note.displayName.toLowerCase().includes(query)
			);
		});
	}, [kind, search, selectedDay, upcoming.data, view]);

	const exportRows =
		view === "calendar"
			? rows.filter((send) => send.sendDate === selectedDay)
			: rows;

	const skip = useMutation({
		mutationFn: (input: {
			templateId: number;
			associateOID: string;
			milestoneType: UpcomingPerson["milestoneType"];
			milestoneDate: string;
			displayName: string;
		}) =>
			skipPerson({
				data: {
					templateId: input.templateId,
					associateOID: input.associateOID,
					milestoneType: input.milestoneType,
					milestoneDate: input.milestoneDate,
				},
			}),
		onSuccess: async (_, { displayName }) => {
			toastAction(`Skipped ${displayName} for this send.`);
			await queryClient.invalidateQueries({ queryKey: ["upcoming"] });
		},
		onError: (error) => {
			toastError(actionErrorMessage(error, "Could not skip this person"));
		},
	});
	const restore = useMutation({
		mutationFn: (note: SkippedNote) =>
			undoSkip({
				data: {
					templateId: note.templateId,
					associateOID: note.associateOID,
					milestoneType: note.milestoneType,
					milestoneDate: note.milestoneDate,
				},
			}),
		onSuccess: async (_, note) => {
			toastAction(`Restored ${note.displayName} to upcoming.`);
			await queryClient.invalidateQueries({ queryKey: ["upcoming"] });
		},
		onError: (error) => {
			toastError(actionErrorMessage(error, "Could not restore this person"));
		},
	});

	function skipEmployee(send: UpcomingSend, person: UpcomingPerson) {
		skip.mutate({
			templateId: send.templateId,
			associateOID: person.associateOID,
			milestoneType: person.milestoneType,
			milestoneDate: person.date.slice(0, 10),
			displayName: person.displayName,
		});
	}

	const emptyMessage =
		upcoming.data?.sends.length === 0 && upcoming.data.skipped.length === 0
			? "No upcoming notes. Create and turn on a template first."
			: "No upcoming notes match this view.";

	return (
		<AppShell
			heading="Upcoming"
			title="Who would get a note from the templates that are turned on. Nothing is sent from this screen."
		>
			<section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-card shadow-sm">
				<div className="flex shrink-0 flex-col gap-3 border-b border-[var(--line)] p-4 sm:flex-row sm:items-center">
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Search person, manager, or template"
						aria-label="Search upcoming sends"
						className="bg-card"
					/>
					<select
						value={kind}
						onChange={(event) =>
							setKind(event.target.value as (typeof filters)[number]["id"])
						}
						aria-label="Filter by template kind"
						className="h-9 w-full shrink-0 rounded-md border border-input bg-card px-3 text-sm text-foreground sm:w-44"
					>
						{filters.map((filter) => (
							<option key={filter.id} value={filter.id}>
								{filter.label}
							</option>
						))}
					</select>
					<div
						role="group"
						aria-label="Upcoming view"
						className="flex shrink-0 rounded-md border border-input p-0.5"
					>
						<button
							type="button"
							aria-pressed={view === "list"}
							onClick={() => setView("list")}
							className={cn(
								"inline-flex h-8 items-center gap-1.5 rounded px-3 text-sm font-medium",
								view === "list"
									? "bg-[var(--brand-indigo)] text-white dark:bg-white dark:text-[var(--brand-indigo)]"
									: "text-[var(--brand-indigo)] hover:bg-[var(--brand-tint-25)] dark:text-white",
							)}
						>
							<List className="size-4" />
							List
						</button>
						<button
							type="button"
							aria-pressed={view === "calendar"}
							onClick={() => setView("calendar")}
							className={cn(
								"inline-flex h-8 items-center gap-1.5 rounded px-3 text-sm font-medium",
								view === "calendar"
									? "bg-[var(--brand-indigo)] text-white dark:bg-white dark:text-[var(--brand-indigo)]"
									: "text-[var(--brand-indigo)] hover:bg-[var(--brand-tint-25)] dark:text-white",
							)}
						>
							<CalendarDays className="size-4" />
							Calendar
						</button>
					</div>
					<Button
						type="button"
						variant="outline"
						className="shrink-0"
						disabled={!upcoming.data}
						onClick={() => {
							downloadCsv(exportRows);
							toastAction(
								exportRows.length
									? `Downloaded ${exportRows.length} row${exportRows.length === 1 ? "" : "s"}.`
									: "Nothing to download for this view.",
							);
						}}
					>
						Download
					</Button>
				</div>
				{upcoming.isPending ? (
					<p className="p-6 text-sm text-[var(--sea-ink-soft)]">
						Building the upcoming list from ADP and your templates…
					</p>
				) : null}
				{upcoming.isError ? (
					<div className="space-y-3 p-6">
						<p className="text-sm text-destructive" role="alert">
							{upcoming.error instanceof Error
								? upcoming.error.message
								: "Could not load upcoming notes"}
						</p>
						<Button variant="outline" onClick={() => upcoming.refetch()}>
							Try again
						</Button>
					</div>
				) : null}
				{upcoming.data && view === "list" ? (
					<SendTable
						rows={rows}
						skipped={skipped}
						empty={emptyMessage}
						openId={openId}
						onTogglePeople={(id) => setOpenId(openId === id ? null : id)}
						onPreview={setPreview}
						onSkip={skipEmployee}
						onUndo={(note) => restore.mutate(note)}
						busy={skip.isPending || restore.isPending}
					/>
				) : null}
				{upcoming.data && view === "calendar" ? (
					<UpcomingCalendar
						rows={rows}
						today={today}
						focusIso={initialDate}
						onSelect={setSelectedDay}
					>
						{(sends) => (
							<SendTable
								rows={sends}
								skipped={skipped}
								empty="No notes on this day."
								openId={openId}
								onTogglePeople={(id) => setOpenId(openId === id ? null : id)}
								onPreview={setPreview}
								onSkip={skipEmployee}
								onUndo={(note) => restore.mutate(note)}
								busy={skip.isPending || restore.isPending}
							/>
						)}
					</UpcomingCalendar>
				) : null}
			</section>
			<EmailPreviewDialog
				send={preview}
				onOpenChange={(open) => {
					if (!open) setPreview(null);
				}}
			/>
		</AppShell>
	);
}

function SendTable({
	rows,
	skipped,
	empty,
	openId,
	onTogglePeople,
	onPreview,
	onSkip,
	onUndo,
	busy,
}: {
	rows: UpcomingSend[];
	skipped: SkippedNote[];
	empty: string;
	openId: string | null;
	onTogglePeople: (id: string) => void;
	onPreview: (send: UpcomingSend) => void;
	onSkip: (send: UpcomingSend, person: UpcomingPerson) => void;
	onUndo: (note: SkippedNote) => void;
	busy: boolean;
}) {
	return (
		<div className="min-h-0 flex-1 overflow-auto">
			<table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
				<caption className="sr-only">Upcoming template sends</caption>
				<thead className="bg-[var(--brand-tint-25)] text-xs uppercase tracking-wide text-[var(--brand-indigo-light)]">
					<tr>
						<th className="sticky top-0 z-[2] bg-[var(--brand-tint-25)] px-4 py-3 font-semibold">
							Send date
						</th>
						<th className="sticky top-0 z-[2] bg-[var(--brand-tint-25)] px-3 py-3 font-semibold">
							Template
						</th>
						<th className="sticky top-0 z-[2] bg-[var(--brand-tint-25)] px-3 py-3 font-semibold">
							To
						</th>
						<th className="sticky top-0 z-[2] bg-[var(--brand-tint-25)] px-3 py-3 font-semibold">
							About
						</th>
						<th className="sticky top-0 z-[2] bg-[var(--brand-tint-25)] px-4 py-3 font-semibold">
							{" "}
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.length === 0 && skipped.length === 0 ? (
						<tr>
							<td colSpan={5} className="px-4 py-8 text-[var(--sea-ink-soft)]">
								{empty}
							</td>
						</tr>
					) : (
						rows.map((send) => (
							<tr
								key={send.id}
								className="border-t border-[var(--line)] align-top"
							>
								<td className="px-4 py-3 font-semibold">
									<div>{formatDate(send.sendDate)}</div>
									<div className="text-xs font-normal text-[var(--sea-ink-soft)]">
										{formatSendAt(send.sendAt)} ET
									</div>
								</td>
								<td className="px-3 py-3">
									<div>{send.templateName}</div>
									<Badge variant="secondary" className="mt-1">
										{TEMPLATE_KIND_COPY[send.kind].label}
									</Badge>
								</td>
								<td className="px-3 py-3">
									<div>{send.recipientName}</div>
									<div className="text-xs text-[var(--sea-ink-soft)]">
										{send.recipientEmails.length
											? send.recipientEmails.join(", ")
											: "No email on file"}
									</div>
								</td>
								<td className="px-3 py-3">
									<div>{send.summary}</div>
									<div className="text-xs text-[var(--sea-ink-soft)]">
										{send.subjectPreview}
									</div>
								</td>
								<td className="px-4 py-3">
									<div className="flex flex-wrap justify-end gap-2">
										<Button
											size="sm"
											variant="outline"
											onClick={() => onTogglePeople(send.id)}
										>
											{openId === send.id ? "Hide" : "People"}
										</Button>
										<Button size="sm" onClick={() => onPreview(send)}>
											Preview
										</Button>
										{send.employees.length === 1 ? (
											<Button
												size="sm"
												variant="outline"
												disabled={busy}
												onClick={() => onSkip(send, send.employees[0])}
											>
												Skip
											</Button>
										) : null}
									</div>
									{openId === send.id ? (
										<ul className="mt-3 space-y-2 text-xs text-[var(--sea-ink-soft)]">
											{send.employees.map((person) => (
												<li
													key={`${person.associateOID}-${person.milestoneType}`}
													className="flex items-center justify-end gap-2"
												>
													<span>
														{person.displayName} · {person.milestoneType}
														{person.years != null
															? ` · ${person.years} yr`
															: ""}
													</span>
													{send.employees.length > 1 ? (
														<Button
															size="sm"
															variant="outline"
															disabled={busy}
															onClick={() => onSkip(send, person)}
														>
															Skip
														</Button>
													) : null}
												</li>
											))}
										</ul>
									) : null}
								</td>
							</tr>
						))
					)}
					{skipped.map((note) => (
						<tr
							key={`skip-${note.templateId}-${note.associateOID}-${note.milestoneType}-${note.milestoneDate}`}
							className="border-t border-[var(--line)] align-top text-[var(--sea-ink-soft)]"
						>
							<td className="px-4 py-3">
								<div>{formatDate(note.sendDate)}</div>
								<div className="text-xs">{formatSendAt(note.sendAt)} ET</div>
							</td>
							<td className="px-3 py-3">{note.templateName}</td>
							<td className="px-3 py-3">Skipped</td>
							<td className="px-3 py-3">
								{note.displayName} · {note.milestoneType}
							</td>
							<td className="px-4 py-3 text-right">
								<Button
									size="sm"
									variant="outline"
									disabled={busy}
									onClick={() => onUndo(note)}
								>
									Undo
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
