import { describe, expect, test } from "bun:test";
import type { NextFunction, Response } from "express";
import type { DemoTokenClaims, Key0Request } from "./auth";
import { requireOperation } from "./auth";

type ResponseRecorder = {
	statusCode: number;
	body: unknown;
};

function createResponseRecorder(): { recorder: ResponseRecorder; response: Response } {
	const recorder: ResponseRecorder = {
		statusCode: 200,
		body: undefined,
	};

	const response = {
		status(code: number) {
			recorder.statusCode = code;
			return response;
		},
		json(body: unknown) {
			recorder.body = body;
			return response;
		},
	};

	return {
		recorder,
		response: response as unknown as Response,
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
		const { response } = createResponseRecorder();
		let nextCalled = false;

		requireOperation("scrape")(req, response, (() => {
			nextCalled = true;
		}) as NextFunction);

		expect(nextCalled).toBe(true);
		expect(req.key0Token?.planId).toBe("single-url-scrape");
	});

	test("rejects a token when the route does not match the issued resource", () => {
		const req = { key0Token: createTokenClaims() } as Key0Request;
		const { recorder, response } = createResponseRecorder();
		let nextCalled = false;

		requireOperation("crawl")(req, response, (() => {
			nextCalled = true;
		}) as NextFunction);

		expect(nextCalled).toBe(false);
		expect(recorder.statusCode).toBe(403);
		expect(recorder.body).toEqual({
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
		const { recorder, response } = createResponseRecorder();
		let nextCalled = false;

		requireOperation("scrape")(req, response, (() => {
			nextCalled = true;
		}) as NextFunction);

		expect(nextCalled).toBe(false);
		expect(recorder.statusCode).toBe(403);
		expect(recorder.body).toEqual({
			type: "Error",
			code: "FORBIDDEN",
			message: 'Unknown plan "mystery-plan" in Key0 token',
		});
	});
});
