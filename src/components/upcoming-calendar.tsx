import {
	Button,
	makeStyles,
	tokens,
} from "@fluentui/react-components";
import {
	CalendarLtr24Regular,
	ChevronLeft24Regular,
	ChevronRight24Regular,
} from "@fluentui/react-icons";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
	countsByMilestone,
	groupSendsByDate,
	monthCells,
	monthTitle,
	shiftMonth,
} from "#/lib/calendar";
import { formatDate } from "#/lib/dates";
import { parseIso, toIso } from "#/lib/schedule";
import type { MilestoneType, UpcomingSend } from "#/lib/types";
import { MILESTONE_BADGE, MILESTONE_ORDER } from "#/lib/types";
import { useTheme } from "#/theme/useTheme";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const useStyles = makeStyles({
	root: {
		display: "flex",
		flex: 1,
		flexDirection: "column",
		minHeight: 0,
		overflow: "hidden",
	},
	toolbar: {
		display: "flex",
		flexWrap: "wrap",
		alignItems: "center",
		gap: "12px",
		padding: "12px 16px",
		borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
	},
	monthNav: {
		display: "flex",
		alignItems: "center",
		gap: "4px",
	},
	monthTitle: {
		minWidth: "11rem",
		margin: 0,
		textAlign: "center",
		fontWeight: tokens.fontWeightSemibold,
	},
	filters: {
		display: "flex",
		flexWrap: "wrap",
		gap: "8px",
		marginLeft: "auto",
	},
	filter: {
		display: "inline-flex",
		alignItems: "center",
		gap: "6px",
		borderRadius: tokens.borderRadiusCircular,
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		padding: "4px 10px",
		fontSize: tokens.fontSizeBase200,
		fontWeight: tokens.fontWeightSemibold,
		background: tokens.colorNeutralBackground1,
		color: tokens.colorNeutralForeground3,
		cursor: "pointer",
	},
	dot: {
		width: "8px",
		height: "8px",
		borderRadius: tokens.borderRadiusCircular,
	},
	gridWrap: {
		flex: 1.3,
		minHeight: 0,
		overflow: "auto",
		padding: "12px",
	},
	grid: {
		display: "grid",
		height: "100%",
		minHeight: "28rem",
		gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
		gridTemplateRows: "auto repeat(6, minmax(0, 1fr))",
		gap: "4px",
	},
	weekday: {
		margin: 0,
		paddingBottom: "4px",
		textAlign: "center",
		fontSize: "11px",
		fontWeight: tokens.fontWeightSemibold,
		letterSpacing: "0.04em",
		textTransform: "uppercase",
		color: tokens.colorNeutralForeground3,
	},
	day: {
		display: "flex",
		minHeight: 0,
		flexDirection: "column",
		gap: "4px",
		borderRadius: tokens.borderRadiusMedium,
		border: "1px solid transparent",
		padding: "6px",
		textAlign: "left",
		cursor: "pointer",
		background: tokens.colorNeutralBackground1,
		color: tokens.colorNeutralForeground1,
	},
	dayNumber: {
		fontSize: tokens.fontSizeBase200,
		fontWeight: tokens.fontWeightSemibold,
	},
	badges: {
		display: "flex",
		flexWrap: "wrap",
		gap: "2px",
		marginTop: "auto",
	},
	count: {
		display: "inline-flex",
		minWidth: "20px",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: tokens.borderRadiusCircular,
		padding: "0 6px",
		fontSize: "10px",
		fontWeight: tokens.fontWeightBold,
		lineHeight: "16px",
	},
	detail: {
		display: "flex",
		flex: 1,
		flexDirection: "column",
		minHeight: 0,
		overflow: "hidden",
		borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
	},
	detailHead: {
		display: "flex",
		alignItems: "center",
		gap: "8px",
		padding: "8px 16px",
	},
	detailScroll: {
		flex: 1,
		minHeight: 0,
		overflow: "auto",
	},
});

export function UpcomingCalendar({
	rows,
	today,
	focusIso,
	onSelect,
	children,
}: {
	rows: UpcomingSend[];
	today: string;
	focusIso?: string;
	onSelect?: (iso: string) => void;
	children: (sends: UpcomingSend[], selectedIso: string) => ReactNode;
}) {
	const styles = useStyles();
	const { theme } = useTheme();
	const initial = parseIso(focusIso ?? today) ?? {
		year: 2026,
		month: 11,
		day: 1,
	};
	const [cursor, setCursor] = useState({
		year: initial.year,
		month: initial.month,
	});
	const [selectedIso, setSelectedIso] = useState(focusIso ?? today);
	const [shown, setShown] = useState<Record<MilestoneType, boolean>>({
		birthday: true,
		anniversary: true,
	});

	useEffect(() => {
		if (!focusIso) return;
		const parsed = parseIso(focusIso);
		if (parsed) setCursor({ year: parsed.year, month: parsed.month });
		setSelectedIso(focusIso);
	}, [focusIso]);

	const grouped = useMemo(() => groupSendsByDate(rows), [rows]);
	const cells = useMemo(
		() => monthCells(cursor.year, cursor.month),
		[cursor.month, cursor.year],
	);
	const selectedSends = (grouped.get(selectedIso) ?? [])
		.map((send) => ({
			...send,
			employees: send.employees.filter((person) => shown[person.milestoneType]),
		}))
		.filter((send) => send.employees.length > 0);

	function toggleType(type: MilestoneType) {
		setShown((current) => ({ ...current, [type]: !current[type] }));
	}

	function go(delta: number) {
		const next = shiftMonth(cursor.year, cursor.month, delta);
		setCursor(next);
		const prefix = `${String(next.year).padStart(4, "0")}-${String(next.month).padStart(2, "0")}`;
		const inMonth = rows.find((send) => send.sendDate.startsWith(prefix));
		const todayParsed = parseIso(today);
		let iso = toIso(next.year, next.month, 1);
		if (
			todayParsed &&
			todayParsed.year === next.year &&
			todayParsed.month === next.month
		) {
			iso = today;
		} else if (inMonth) {
			iso = inMonth.sendDate;
		}
		setSelectedIso(iso);
		onSelect?.(iso);
	}

	function selectDay(iso: string, inMonth: boolean) {
		const parsed = parseIso(iso);
		if (!inMonth && parsed) {
			setCursor({ year: parsed.year, month: parsed.month });
		}
		setSelectedIso(iso);
		onSelect?.(iso);
	}

	return (
		<div className={styles.root}>
			<div className={styles.toolbar}>
				<div className={styles.monthNav}>
					<Button
						appearance="secondary"
						icon={<ChevronLeft24Regular />}
						aria-label="Previous month"
						onClick={() => go(-1)}
					/>
					<p className={styles.monthTitle}>
						{monthTitle(cursor.year, cursor.month)}
					</p>
					<Button
						appearance="secondary"
						icon={<ChevronRight24Regular />}
						aria-label="Next month"
						onClick={() => go(1)}
					/>
				</div>
				<div role="group" aria-label="Milestone type" className={styles.filters}>
					{MILESTONE_ORDER.map((type) => {
						const on = shown[type];
						const badge = MILESTONE_BADGE[type];
						return (
							<button
								key={type}
								type="button"
								aria-pressed={on}
								onClick={() => toggleType(type)}
								className={styles.filter}
								style={
									on
										? {
												background: badge.background,
												color: badge.color,
												borderColor: "transparent",
											}
										: undefined
								}
							>
								<span
									className={styles.dot}
									style={{
										background: on ? "rgba(255,255,255,0.9)" : badge.background,
									}}
									aria-hidden="true"
								/>
								{badge.label}
							</button>
						);
					})}
				</div>
			</div>
			<div className={styles.gridWrap}>
				<div className={styles.grid}>
					{WEEKDAYS.map((day) => (
						<p key={day} className={styles.weekday}>
							{day}
						</p>
					))}
					{cells.map((cell) => {
						const sends = grouped.get(cell.iso) ?? [];
						const counts = countsByMilestone(sends);
						const types = MILESTONE_ORDER.filter(
							(type) => shown[type] && (counts[type] ?? 0) > 0,
						);
						const selected = cell.iso === selectedIso;
						const isToday = cell.iso === today;
						const mix = types
							.map((type) => {
								const count = counts[type] ?? 0;
								const word =
									type === "birthday"
										? count === 1
											? "birthday"
											: "birthdays"
										: count === 1
											? "anniversary"
											: "anniversaries";
								return `${count} ${word}`;
							})
							.join(", ");
						const label = `${formatDate(cell.iso)}${mix ? `, ${mix}` : ""}`;
						return (
							<button
								key={cell.iso}
								type="button"
								aria-pressed={selected}
								aria-label={label}
								onClick={() => selectDay(cell.iso, cell.inMonth)}
								className={styles.day}
								style={{
									opacity: cell.inMonth ? 1 : 0.55,
									borderColor: selected
										? "#f15d2a"
										: isToday
											? "#24338a"
											: "transparent",
									background: selected
										? theme.isDark
											? "color-mix(in srgb, #f15d2a 32%, transparent)"
											: "#fff1eb"
										: undefined,
									color:
										selected && theme.isDark
											? "#ffffff"
											: undefined,
								}}
							>
								<span className={styles.dayNumber}>{cell.day}</span>
								{types.length > 0 ? (
									<span className={styles.badges}>
										{types.map((type) => (
											<span
												key={type}
												title={`${counts[type]} ${MILESTONE_BADGE[type].label}`}
												className={styles.count}
												style={{
													background: MILESTONE_BADGE[type].background,
													color: MILESTONE_BADGE[type].color,
												}}
											>
												{counts[type]}
											</span>
										))}
									</span>
								) : null}
							</button>
						);
					})}
				</div>
			</div>
			<div className={styles.detail}>
				<div className={styles.detailHead}>
					<CalendarLtr24Regular />
					<p style={{ margin: 0, fontWeight: 600 }}>{formatDate(selectedIso)}</p>
					<p style={{ margin: 0, color: tokens.colorNeutralForeground3 }}>
						{selectedSends.length === 0
							? "No notes on this day"
							: `${selectedSends.length} note${selectedSends.length === 1 ? "" : "s"}`}
					</p>
				</div>
				<div className={styles.detailScroll}>
					{children(selectedSends, selectedIso)}
				</div>
			</div>
		</div>
	);
}
