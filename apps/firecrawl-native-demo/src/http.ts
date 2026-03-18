import { z } from "zod";

const scrapeFormatSchema = z.enum([
	"markdown",
	"html",
	"rawHtml",
	"links",
	"images",
	"summary",
	"screenshot",
	"branding",
]);

export const scrapeRequestSchema = z.object({
	url: z.string().url(),
	formats: z.array(scrapeFormatSchema).min(1).default(["markdown"]),
	onlyMainContent: z.boolean().optional(),
	waitFor: z.coerce.number().int().min(0).max(30000).optional(),
});

export const crawlRequestSchema = z.object({
	url: z.string().url(),
	limit: z.coerce.number().int().positive().max(25).default(10),
	maxDiscoveryDepth: z.coerce.number().int().positive().max(5).default(2),
	prompt: z.string().min(1).optional(),
});

export const searchRequestSchema = z.object({
	query: z.string().min(1),
	limit: z.coerce.number().int().positive().max(10).default(5),
	scrapeResults: z.boolean().default(true),
});
