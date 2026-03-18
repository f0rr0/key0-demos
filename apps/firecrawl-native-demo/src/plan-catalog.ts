import { z } from "zod";

export const firecrawlOperationSchema = z.enum(["scrape", "crawl", "search"]);
export type FirecrawlOperation = z.infer<typeof firecrawlOperationSchema>;

type DemoPlan = {
	readonly planId: string;
	readonly resourceId: FirecrawlOperation;
	readonly unitAmount: string;
	readonly description: string;
	readonly ttlSeconds: number;
	readonly allowedOperations: readonly [FirecrawlOperation, ...FirecrawlOperation[]];
};

export const firecrawlPlanCatalog: readonly DemoPlan[] = [
	{
		planId: "single-url-scrape",
		resourceId: "scrape",
		unitAmount: "$0.03",
		description: "Scrape one public URL into markdown, html, or links.",
		ttlSeconds: 900,
		allowedOperations: ["scrape"],
	},
	{
		planId: "site-crawl",
		resourceId: "crawl",
		unitAmount: "$0.12",
		description: "Crawl a docs or marketing site and return a paginated crawl result.",
		ttlSeconds: 1800,
		allowedOperations: ["crawl"],
	},
	{
		planId: "web-search",
		resourceId: "search",
		unitAmount: "$0.07",
		description: "Search the web and optionally scrape the result pages.",
		ttlSeconds: 1200,
		allowedOperations: ["search"],
	},
] as const;

export const key0Plans = firecrawlPlanCatalog.map((plan) => ({
	planId: plan.planId,
	unitAmount: plan.unitAmount,
	description: plan.description,
}));

export function getDemoPlan(planId: string): DemoPlan {
	const plan = firecrawlPlanCatalog.find((candidate) => candidate.planId === planId);

	if (!plan) {
		throw new Error(`Unknown demo plan: ${planId}`);
	}

	return plan;
}

export function getResourceIdForPlan(planId: string): FirecrawlOperation {
	return getDemoPlan(planId).resourceId;
}

export function getAllowedOperationsForPlan(planId: string) {
	return getDemoPlan(planId).allowedOperations;
}

export function getTokenTtlForPlan(planId: string) {
	return getDemoPlan(planId).ttlSeconds;
}
