import { DEFAULT_SEND_AT } from "#/lib/types";

export function normalizeSendAt(value: string | null | undefined) {
	const match = /^(\d{1,2}):(\d{2})/.exec(String(value ?? "").trim());
	if (!match) return DEFAULT_SEND_AT;
	const hour = Number(match[1]);
	const minute = Number(match[2]);
	if (hour > 23 || minute > 59) return DEFAULT_SEND_AT;
	return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatSendAt(value: string | null | undefined) {
	const [hour, minute] = normalizeSendAt(value).split(":").map(Number);
	return new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
		timeZone: "UTC",
	}).format(new Date(Date.UTC(2000, 0, 1, hour, minute)));
}

export function formatDate(iso: string | null) {
	if (!iso) return "No date";
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
	if (!match) return "No date";
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	if (month < 1 || month > 12 || day < 1 || day > 31) return "No date";
	const date = new Date(Date.UTC(year === 0 ? 2000 : year, month - 1, day));
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		...(year === 0 ? {} : { year: "numeric" as const }),
		timeZone: "UTC",
	}).format(date);
}

export function dateNote(iso: string | null) {
	return iso?.startsWith("0000-") ? "Year not in ADP" : null;
}

export function formatTimestamp(value: string) {
	const iso = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(date);
}
