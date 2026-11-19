import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Badge,
	Button,
	Dropdown,
	Input,
	makeStyles,
	Option,
	tokens,
} from "@fluentui/react-components";
import {
	CalendarLtr24Regular,
	TextBulletListLtr24Regular,
} from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "#/components/app-shell";
import { EmailPreviewDialog } from "#/components/email-preview-dialog";
import { UpcomingCalendar } from "#/components/upcoming-calendar";
import { formatDate, formatSendAt } from "#/lib/dates";
import { todayIso } from "#/lib/schedule";
import { actionErrorMessage, toastAction, toastError } from "#/lib/toast";
import type {
	SkippedNote,
	TemplateKind,
	UpcomingPerson,
	UpcomingSend,
} from "#/lib/types";
import { isCeoKind, TEMPLATE_KIND_COPY } from "#/lib/types";
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

const useStyles = makeStyles({
	panel: {
		display: "flex",
		flex: 1,
		flexDirection: "column",
		minHeight: 0,
		overflow: "hidden",
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		borderRadius: tokens.borderRadiusXLarge,
		backgroundColor: tokens.colorNeutralBackground1,
	},
	toolbar: {
		display: "flex",
		flexWrap: "wrap",
		alignItems: "center",
		gap: "12px",
		padding: "16px",
		borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
	},
	search: {
		flex: 1,
		minWidth: "16rem",
	},
	scroll: {
		flex: 1,
		minHeight: 0,
		overflow: "auto",
	},
	table: {
		width: "100%",
		borderCollapse: "collapse",
		fontSize: tokens.fontSizeBase300,
	},
	head: {
		position: "sticky",
		top: 0,
		backgroundColor: tokens.colorNeutralBackground2,
		textAlign: "left",
	},
	cell: {
		padding: "12px",
		borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
		verticalAlign: "top",
	},
	actions: {
		display: "flex",
		flexWrap: "wrap",
		justifyContent: "flex-end",
		gap: "8px",
	},
	people: {
		marginTop: "12px",
		padding: 0,
		listStyle: "none",
		color: tokens.colorNeutralForeground3,
		fontSize: tokens.fontSizeBase200,
	},
	muted: {
		color: tokens.colorNeutralForeground3,
	},
	message: {
		padding: "24px",
		color: tokens.colorNeutralForeground3,
	},
});

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
	const styles = useStyles();
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
	const selectedKind = filters.find((filter) => filter.id === kind) ?? filters[0];

	return (
		<AppShell
			heading="Upcoming"
			title="Who would get a note from the templates that are turned on. Nothing is sent from this screen."
		>
			<section className={styles.panel}>
				<div className={styles.toolbar}>
					<Input
						className={styles.search}
						value={search}
						onChange={(_, data) => setSearch(data.value)}
						placeholder="Search person, manager, or template"
						aria-label="Search upcoming sends"
					/>
					<Dropdown
						aria-label="Filter by template kind"
						value={selectedKind.label}
						selectedOptions={[kind]}
						onOptionSelect={(_, data) => {
							if (data.optionValue) {
								setKind(data.optionValue as (typeof filters)[number]["id"]);
							}
						}}
					>
						{filters.map((filter) => (
							<Option key={filter.id} value={filter.id}>
								{filter.label}
							</Option>
						))}
					</Dropdown>
					<Button
						appearance={view === "list" ? "primary" : "secondary"}
						icon={<TextBulletListLtr24Regular />}
						aria-pressed={view === "list"}
						onClick={() => setView("list")}
					>
						List
					</Button>
					<Button
						appearance={view === "calendar" ? "primary" : "secondary"}
						icon={<CalendarLtr24Regular />}
						aria-pressed={view === "calendar"}
						onClick={() => setView("calendar")}
					>
						Calendar
					</Button>
					<Button
						appearance="secondary"
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
					<p className={styles.message}>
						Building the upcoming list from ADP and your templates…
					</p>
				) : null}
				{upcoming.isError ? (
					<div className={styles.message}>
						<p role="alert">
							{upcoming.error instanceof Error
								? upcoming.error.message
								: "Could not load upcoming notes"}
						</p>
						<Button appearance="secondary" onClick={() => upcoming.refetch()}>
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
	const styles = useStyles();
	return (
		<div className={styles.scroll}>
			<table className={styles.table}>
				<caption className="sr-only">Upcoming template sends</caption>
				<thead className={styles.head}>
					<tr>
						<th className={styles.cell}>Send date</th>
						<th className={styles.cell}>Template</th>
						<th className={styles.cell}>To</th>
						<th className={styles.cell}>About</th>
						<th className={styles.cell}> </th>
					</tr>
				</thead>
				<tbody>
					{rows.length === 0 && skipped.length === 0 ? (
						<tr>
							<td className={styles.cell} colSpan={5}>
								{empty}
							</td>
						</tr>
					) : (
						rows.map((send) => (
							<tr key={send.id}>
								<td className={styles.cell}>
									<div>{formatDate(send.sendDate)}</div>
									<div className={styles.muted}>
										{formatSendAt(send.sendAt)} ET
									</div>
								</td>
								<td className={styles.cell}>
									<div>{send.templateName}</div>
									<Badge appearance="tint">{TEMPLATE_KIND_COPY[send.kind].label}</Badge>
								</td>
								<td className={styles.cell}>
									<div>{send.recipientName}</div>
									<div className={styles.muted}>
										{send.recipientEmails.length
											? send.recipientEmails.join(", ")
											: "No email on file"}
									</div>
								</td>
								<td className={styles.cell}>
									<div>{send.summary}</div>
									<div className={styles.muted}>{send.subjectPreview}</div>
								</td>
								<td className={styles.cell}>
									<div className={styles.actions}>
										<Button
											size="small"
											appearance="secondary"
											onClick={() => onTogglePeople(send.id)}
										>
											{openId === send.id ? "Hide" : "People"}
										</Button>
										<Button
											size="small"
											appearance="primary"
											onClick={() => onPreview(send)}
										>
											Preview
										</Button>
										{send.employees.length === 1 ? (
											<Button
												size="small"
												appearance="secondary"
												disabled={busy}
												onClick={() => onSkip(send, send.employees[0])}
											>
												Skip
											</Button>
										) : null}
									</div>
									{openId === send.id ? (
										<ul className={styles.people}>
											{send.employees.map((person) => (
												<li key={`${person.associateOID}-${person.milestoneType}`}>
													{person.displayName} · {person.milestoneType}
													{person.years != null ? ` · ${person.years} yr` : ""}
													{send.employees.length > 1 ? (
														<Button
															size="small"
															appearance="secondary"
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
							className={styles.muted}
						>
							<td className={styles.cell}>
								<div>{formatDate(note.sendDate)}</div>
								<div>{formatSendAt(note.sendAt)} ET</div>
							</td>
							<td className={styles.cell}>{note.templateName}</td>
							<td className={styles.cell}>Skipped</td>
							<td className={styles.cell}>
								{note.displayName} · {note.milestoneType}
							</td>
							<td className={styles.cell}>
								<Button
									size="small"
									appearance="secondary"
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
