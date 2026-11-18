const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseNotifyList(text: string) {
	const parts = text
		.split(/[\s,;]+/)
		.map((part) => part.trim())
		.filter(Boolean);
	const invalid = parts.filter((part) => !EMAIL.test(part));
	const emails: string[] = [];
	const seen = new Set<string>();
	for (const part of parts) {
		if (!EMAIL.test(part)) continue;
		const key = part.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		emails.push(part);
	}
	return { emails, invalid };
}

export function formatNotifyList(emails: string[]) {
	return emails.join("\n");
}
