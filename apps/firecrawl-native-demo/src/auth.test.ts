import { describe, expect, test } from "bun:test";
import type { NextFunction, Response } from "express";
import type { DemoTokenClaims, Key0Request } from "./auth";
import { requireOperation } from "./auth";

type MockResponse = Pick<Response, "status" | "json"> & {
	statusCode: number;
	body: unknown;
};

function createResponse(): MockResponse {
	return {
		statusCode: 200,
		body: undefined,
		status(code) {
			this.statusCode = code;
			return this;
		},
		json(body) {
			this.body = body;
			return this;
		},
	};
}

function createTokenClaims(overrides: Partial<DemoTokenClaims> = {}): DemoTokenClaims {
	return {
		sub: "request-1",
		jti: "challenge-1",
		resourceId: "scrape",
		planId: "single-url-scrape",
		txHash: "0xabc",
		...overrides,
	};
}

describe("requireOperation", () => {
	test("allows a token whose plan and resource match the protected operation", () => {
		const req = { key0Token: createTokenClaims() } as Key0Request;
		const res = createResponse();
		let nextCalled = false;

		requireOperation("scrape")(
			req,
			res as Response,
			(() => {
				nextCalled = true;
			}) as NextFunction,
		);

		expect(nextCalled).toBe(true);
		expect(req.key0Token?.planId).toBe("single-url-scrape");
	});

	test("rejects a token when the route does not match the issued resource", () => {
		const req = { key0Token: createTokenClaims() } as Key0Request;
		const res = createResponse();
		let nextCalled = false;

		requireOperation("crawl")(
			req,
			res as Response,
			(() => {
				nextCalled = true;
			}) as NextFunction,
		);

		expect(nextCalled).toBe(false);
		expect(res.statusCode).toBe(403);
		expect(res.body).toEqual({
			type: "Error",
			code: "FORBIDDEN",
			message: 'Token does not allow the "crawl" operation',
			details: {
				planId: "single-url-scrape",
				resourceId: "scrape",
				allowedOperations: ["scrape"],
			},
		});
	});

	test("rejects a token whose plan id is not in the seller catalog", () => {
		const req = {
			key0Token: createTokenClaims({ planId: "mystery-plan" }),
		} as Key0Request;
		const res = createResponse();
		let nextCalled = false;

		requireOperation("scrape")(
			req,
			res as Response,
			(() => {
				nextCalled = true;
			}) as NextFunction,
		);

		expect(nextCalled).toBe(false);
		expect(res.statusCode).toBe(403);
		expect(res.body).toEqual({
			type: "Error",
			code: "FORBIDDEN",
			message: 'Unknown plan "mystery-plan" in Key0 token',
		});
	});
});
