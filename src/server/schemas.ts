import { z } from "zod";

const email = z
	.string()
	.trim()
	.min(3)
	.max(320)
	.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email");

export const templateKind = z.enum([
	"employee_day_of",
	"manager_monthly",
	"ceo_anniversary",
	"ceo_monthly",
]);

const milestoneType = z.enum(["anniversary", "birthday"]);

export const saveTemplateSchema = z
	.object({
		id: z.number().int().positive().optional(),
		name: z.string().trim().min(1, "Enter a template name").max(200),
		kind: templateKind,
		milestoneTypes: z
			.array(milestoneType)
			.min(1, "Choose birthday, anniversary, or both"),
		daysBeforeMonthStart: z.number().int().min(0).max(28).default(14),
		anniversaryYears: z.array(z.number().int().min(1).max(80)).default([]),
		recipientEmails: z.array(email).max(50).default([]),
		sendAt: z
			.string()
			.trim()
			.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a send time")
			.default("09:00"),
		emailSubject: z.string().trim().min(1, "Enter an email subject").max(400),
		emailBody: z.string().trim().min(1, "Enter an email body").max(20000),
		enabled: z.boolean().default(true),
	})
	.superRefine((value, ctx) => {
		if (value.kind === "ceo_anniversary" || value.kind === "ceo_monthly") {
			if (!value.recipientEmails.length) {
				ctx.addIssue({
					code: "custom",
					path: ["recipientEmails"],
					message: "Add the CEO email (and anyone else who should get this)",
				});
			}
		}
		if (value.kind === "ceo_anniversary") {
			if (!value.anniversaryYears.length) {
				ctx.addIssue({
					code: "custom",
					path: ["anniversaryYears"],
					message: "Add at least one year mark, such as 1, 5, or 10",
				});
			}
			if (!value.milestoneTypes.includes("anniversary")) {
				ctx.addIssue({
					code: "custom",
					path: ["milestoneTypes"],
					message: "CEO notes are for anniversary year marks",
				});
			}
		}
	});

export const deleteTemplateSchema = z.object({
	id: z.number().int().positive(),
});

export const sendSkipSchema = z.object({
	templateId: z.number().int().positive(),
	associateOID: z.string().trim().min(1).max(128),
	milestoneType: milestoneType,
	milestoneDate: z
		.string()
		.trim()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a milestone date"),
});

export type SaveTemplateInput = z.infer<typeof saveTemplateSchema>;
