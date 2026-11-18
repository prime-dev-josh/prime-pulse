import { useQuery } from "@tanstack/react-query";
import { CalendarDays, List } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "#/components/app-shell";
import { EmailPreviewDialog } from "#/components/email-preview-dialog";
import { UpcomingCalendar } from "#/components/upcoming-calendar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { formatDate, formatSendAt } from "#/lib/dates";
import { todayIso } from "#/lib/schedule";
import type { TemplateKind, UpcomingSend } from "#/lib/types";
import { TEMPLATE_KIND_COPY, isCeoKind } from "#/lib/types";
import { cn } from "#/lib/utils";
import { getUpcoming } from "#/server/functions";

const filters: Array<{
	id: "all" | "ceo" | TemplateKind;
	label: string;
}> = [
	{ id: "all", label: "All" },
	{ id: "employee_day_of", label: "Employee" },
	{ id: "manager_monthly", label: "Manager" },
	{ id: "ceo", label: "CEO" },
];

export function UpcomingScreen() {
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
	const today = todayIso();

	const rows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return (upcoming.data ?? []).filter((send) => {
			if (kind === "ceo") {
				if (!isCeoKind(send.kind)) return false;
			} else if (kind !== "all" && send.kind !== kind) {
				return false;
			}
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

	const emptyMessage =
		upcoming.data?.length === 0
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
						className="h-9 w-full shrink-0 rounded-md border border-input bg-card px-3 text-sm sm:w-44"
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
									? "bg-[var(--brand-indigo)] text-white"
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
									? "bg-[var(--brand-indigo)] text-white"
									: "text-[var(--brand-indigo)] hover:bg-[var(--brand-tint-25)] dark:text-white",
							)}
						>
							<CalendarDays className="size-4" />
							Calendar
						</button>
					</div>
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
						empty={emptyMessage}
						openId={openId}
						onTogglePeople={(id) => setOpenId(openId === id ? null : id)}
						onPreview={setPreview}
					/>
				) : null}
				{upcoming.data && view === "calendar" ? (
					<UpcomingCalendar rows={rows} today={today}>
						{(sends) => (
							<SendTable
								rows={sends}
								empty="No notes on this day."
								openId={openId}
								onTogglePeople={(id) => setOpenId(openId === id ? null : id)}
								onPreview={setPreview}
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
	empty,
	openId,
	onTogglePeople,
	onPreview,
}: {
	rows: UpcomingSend[];
	empty: string;
	openId: string | null;
	onTogglePeople: (id: string) => void;
	onPreview: (send: UpcomingSend) => void;
}) {
	return (
		<div className="min-h-0 flex-1 overflow-auto">
			<table className="w-full min-w-[760px] text-left text-sm">
				<caption className="sr-only">Upcoming template sends</caption>
				<thead className="sticky top-0 bg-[var(--brand-tint-25)] text-xs uppercase tracking-wide text-[var(--brand-indigo-light)]">
					<tr>
						<th className="px-4 py-3 font-semibold">Send date</th>
						<th className="px-3 py-3 font-semibold">Template</th>
						<th className="px-3 py-3 font-semibold">To</th>
						<th className="px-3 py-3 font-semibold">About</th>
						<th className="px-4 py-3 font-semibold"> </th>
					</tr>
				</thead>
				<tbody>
					{rows.length === 0 ? (
						<tr>
							<td
								colSpan={5}
								className="px-4 py-8 text-[var(--sea-ink-soft)]"
							>
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
									</div>
									{openId === send.id ? (
										<ul className="mt-3 space-y-1 text-xs text-[var(--sea-ink-soft)]">
											{send.employees.map((person) => (
												<li
													key={`${person.associateOID}-${person.milestoneType}`}
												>
													{person.displayName} · {person.milestoneType}
													{person.years != null
														? ` · ${person.years} yr`
														: ""}
												</li>
											))}
										</ul>
									) : null}
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}
