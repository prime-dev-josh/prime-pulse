import { toIso } from "#/lib/schedule";
import type { MilestoneType, UpcomingSend } from "#/lib/types";

export type CalendarCell = {
	iso: string;
	day: number;
	inMonth: boolean;
};

export function monthCells(year: number, month: number): CalendarCell[] {
	const first = new Date(Date.UTC(year, month - 1, 1));
	const start = new Date(first);
	start.setUTCDate(1 - first.getUTCDay());
	const cells: CalendarCell[] = [];
	for (let index = 0; index < 42; index += 1) {
		const date = new Date(start);
		date.setUTCDate(start.getUTCDate() + index);
		const cellYear = date.getUTCFullYear();
		const cellMonth = date.getUTCMonth() + 1;
		cells.push({
			iso: toIso(cellYear, cellMonth, date.getUTCDate()),
			day: date.getUTCDate(),
			inMonth: cellYear === year && cellMonth === month,
		});
	}
	return cells;
}

export function shiftMonth(year: number, month: number, delta: number) {
	const date = new Date(Date.UTC(year, month - 1 + delta, 1));
	return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function monthTitle(year: number, month: number) {
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function groupSendsByDate(rows: UpcomingSend[]) {
	const grouped = new Map<string, UpcomingSend[]>();
	for (const send of rows) {
		const current = grouped.get(send.sendDate) ?? [];
		current.push(send);
		grouped.set(send.sendDate, current);
	}
	return grouped;
}

export function countsByMilestone(sends: UpcomingSend[]) {
	const counts: Partial<Record<MilestoneType, number>> = {};
	for (const send of sends) {
		for (const person of send.employees) {
			counts[person.milestoneType] = (counts[person.milestoneType] ?? 0) + 1;
		}
	}
	return counts;
}
