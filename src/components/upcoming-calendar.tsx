import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "#/components/ui/button";
import {
	countsByMilestone,
	groupSendsByDate,
	monthCells,
	monthTitle,
	shiftMonth,
} from "#/lib/calendar";
import { formatDate } from "#/lib/dates";
import { parseIso, toIso } from "#/lib/schedule";
import type { UpcomingSend } from "#/lib/types";
import { MILESTONE_BADGE, MILESTONE_ORDER } from "#/lib/types";
import { cn } from "#/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function UpcomingCalendar({
	rows,
	today,
	children,
}: {
	rows: UpcomingSend[];
	today: string;
	children: (sends: UpcomingSend[], selectedIso: string) => ReactNode;
}) {
	const initial = parseIso(today) ?? { year: 2026, month: 11, day: 1 };
	const [cursor, setCursor] = useState({
		year: initial.year,
		month: initial.month,
	});
	const [selectedIso, setSelectedIso] = useState(today);

	const grouped = useMemo(() => groupSendsByDate(rows), [rows]);
	const cells = useMemo(
		() => monthCells(cursor.year, cursor.month),
		[cursor.month, cursor.year],
	);
	const selectedSends = grouped.get(selectedIso) ?? [];

	function go(delta: number) {
		const next = shiftMonth(cursor.year, cursor.month, delta);
		setCursor(next);
		const prefix = `${String(next.year).padStart(4, "0")}-${String(next.month).padStart(2, "0")}`;
		const inMonth = rows.find((send) => send.sendDate.startsWith(prefix));
		const todayParsed = parseIso(today);
		if (
			todayParsed &&
			todayParsed.year === next.year &&
			todayParsed.month === next.month
		) {
			setSelectedIso(today);
		} else if (inMonth) {
			setSelectedIso(inMonth.sendDate);
		} else {
			setSelectedIso(toIso(next.year, next.month, 1));
		}
	}

	function selectDay(iso: string, inMonth: boolean) {
		const parsed = parseIso(iso);
		if (!inMonth && parsed) {
			setCursor({ year: parsed.year, month: parsed.month });
		}
		setSelectedIso(iso);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[var(--line)] px-4 py-3">
				<div className="flex items-center gap-1">
					<Button
						type="button"
						size="icon"
						variant="outline"
						aria-label="Previous month"
						onClick={() => go(-1)}
					>
						<ChevronLeft />
					</Button>
					<p className="min-w-44 text-center text-sm font-semibold text-[var(--brand-ink)]">
						{monthTitle(cursor.year, cursor.month)}
					</p>
					<Button
						type="button"
						size="icon"
						variant="outline"
						aria-label="Next month"
						onClick={() => go(1)}
					>
						<ChevronRight />
					</Button>
				</div>
				<ul className="ml-auto flex flex-wrap items-center gap-3 text-xs text-[var(--sea-ink-soft)]">
					{MILESTONE_ORDER.map((type) => (
						<li key={type} className="flex items-center gap-1.5">
							<span
								className={cn(
									"size-2.5 rounded-full",
									MILESTONE_BADGE[type].className,
								)}
								aria-hidden="true"
							/>
							{MILESTONE_BADGE[type].label}
						</li>
					))}
				</ul>
			</div>
			<div className="min-h-0 flex-[1.3] overflow-auto p-3">
				<div className="grid h-full min-h-[28rem] grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] gap-1">
					{WEEKDAYS.map((day) => (
						<p
							key={day}
							className="px-1 pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-indigo-light)]"
						>
							{day}
						</p>
					))}
					{cells.map((cell) => {
						const sends = grouped.get(cell.iso) ?? [];
						const counts = countsByMilestone(sends);
						const types = MILESTONE_ORDER.filter(
							(type) => (counts[type] ?? 0) > 0,
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
								className={cn(
									"flex min-h-0 flex-col gap-1 rounded-lg border p-1.5 text-left transition-colors",
									cell.inMonth
										? "bg-white"
										: "bg-[var(--brand-tint-25)] text-[var(--sea-ink-soft)]",
									selected
										? "border-[var(--brand-orange)] bg-[#fff7f3]"
										: "border-transparent hover:border-[var(--line)]",
									isToday && !selected
										? "border-[var(--brand-indigo)]"
										: null,
								)}
							>
								<span
									className={cn(
										"text-xs font-semibold",
										isToday ? "text-[var(--brand-indigo)]" : null,
									)}
								>
									{cell.day}
								</span>
								{types.length > 0 ? (
									<span className="mt-auto flex flex-wrap gap-0.5">
										{types.map((type) => (
											<span
												key={type}
												title={`${counts[type]} ${MILESTONE_BADGE[type].label}`}
												className={cn(
													"inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums leading-4",
													MILESTONE_BADGE[type].className,
												)}
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
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-[var(--line)]">
				<div className="flex shrink-0 items-center gap-2 px-4 py-2 text-sm">
					<CalendarDays className="size-4 text-[var(--brand-indigo)]" />
					<p className="font-semibold text-[var(--brand-ink)]">
						{formatDate(selectedIso)}
					</p>
					<p className="text-[var(--sea-ink-soft)]">
						{selectedSends.length === 0
							? "No notes on this day"
							: `${selectedSends.length} note${selectedSends.length === 1 ? "" : "s"}`}
					</p>
				</div>
				<div className="min-h-0 flex-1 overflow-auto">
					{children(selectedSends, selectedIso)}
				</div>
			</div>
		</div>
	);
}
