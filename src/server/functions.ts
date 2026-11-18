import { createServerFn } from "@tanstack/react-start";
import {
	addSkip,
	deleteTemplate,
	listTemplates,
	listUpcoming,
	removeSkip,
	saveTemplate,
} from "#/server/primepulse";
import {
	deleteTemplateSchema,
	saveTemplateSchema,
	sendSkipSchema,
} from "#/server/schemas";

function parseInput<T>(
	schema: {
		safeParse: (input: unknown) =>
			| { success: true; data: T }
			| {
					success: false;
					error: { issues: { path: PropertyKey[]; message: string }[] };
			  };
	},
	input: unknown,
): T {
	const result = schema.safeParse(input);
	if (!result.success) {
		const issue = result.error.issues[0];
		const path = issue?.path?.length ? `${issue.path.join(".")}: ` : "";
		throw new Error(`${path}${issue?.message ?? "Invalid request"}`);
	}
	return result.data;
}

function dedupeEmails(emails: string[]) {
	const seen = new Set<string>();
	const next: string[] = [];
	for (const email of emails) {
		const key = email.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		next.push(email);
	}
	return next;
}

export const getTemplates = createServerFn({ method: "GET" }).handler(
	async () => listTemplates(),
);

export const getUpcoming = createServerFn({ method: "GET" }).handler(async () =>
	listUpcoming(),
);

export const saveEmailTemplate = createServerFn({ method: "POST" })
	.validator((input: unknown) => {
		const data = parseInput(saveTemplateSchema, input);
		return { ...data, recipientEmails: dedupeEmails(data.recipientEmails) };
	})
	.handler(async ({ data }) => {
		await saveTemplate(data);
		return { ok: true };
	});

export const removeEmailTemplate = createServerFn({ method: "POST" })
	.validator((input: unknown) => parseInput(deleteTemplateSchema, input))
	.handler(async ({ data }) => {
		await deleteTemplate(data.id);
		return { ok: true };
	});

export const skipPerson = createServerFn({ method: "POST" })
	.validator((input: unknown) => parseInput(sendSkipSchema, input))
	.handler(async ({ data }) => {
		await addSkip(data);
		return { ok: true };
	});

export const undoSkip = createServerFn({ method: "POST" })
	.validator((input: unknown) => parseInput(sendSkipSchema, input))
	.handler(async ({ data }) => {
		await removeSkip(data);
		return { ok: true };
	});
