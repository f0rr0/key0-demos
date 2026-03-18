import { describe, expect, test } from "bun:test";
import {
	getAllowedOperationsForPlan,
	getDemoPlan,
	getResourceIdForPlan,
	key0Plans,
} from "./plan-catalog";

describe("plan catalog", () => {
	test("exposes three seller-facing plans", () => {
		expect(key0Plans).toHaveLength(3);
		expect(key0Plans.map((plan) => plan.planId)).toEqual([
			"single-url-scrape",
			"site-crawl",
			"web-search",
		]);
	});

	test("maps each plan to exactly one protected operation", () => {
		expect(getAllowedOperationsForPlan("single-url-scrape")).toEqual(["scrape"]);
		expect(getAllowedOperationsForPlan("site-crawl")).toEqual(["crawl"]);
		expect(getAllowedOperationsForPlan("web-search")).toEqual(["search"]);
		expect(getResourceIdForPlan("web-search")).toBe("search");
	});

	test("describes the seller capability cleanly", () => {
		expect(getDemoPlan("site-crawl").description).toContain("Crawl");
	});
});
