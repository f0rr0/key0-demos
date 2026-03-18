import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
	type FirecrawlOperation,
	firecrawlOperationSchema,
	getAllowedOperationsForPlan,
} from "./plan-catalog";

const tokenClaimsSchema = z.object({
	sub: z.string(),
	jti: z.string(),
	resourceId: firecrawlOperationSchema,
	planId: z.string(),
	txHash: z.string(),
});

export type DemoTokenClaims = z.infer<typeof tokenClaimsSchema>;
export type Key0Request = Request & { key0Token?: DemoTokenClaims };

export function requireOperation(operation: FirecrawlOperation) {
	return (req: Key0Request, res: Response, next: NextFunction) => {
		const parsed = tokenClaimsSchema.safeParse(req.key0Token);

		if (!parsed.success) {
			return res.status(403).json({
				type: "Error",
				code: "FORBIDDEN",
				message: "Missing or invalid Key0 token claims",
			});
		}

		let allowedOperations: readonly FirecrawlOperation[];

		try {
			allowedOperations = getAllowedOperationsForPlan(parsed.data.planId);
		} catch {
			return res.status(403).json({
				type: "Error",
				code: "FORBIDDEN",
				message: `Unknown plan "${parsed.data.planId}" in Key0 token`,
			});
		}

		if (!allowedOperations.includes(operation) || parsed.data.resourceId !== operation) {
			return res.status(403).json({
				type: "Error",
				code: "FORBIDDEN",
				message: `Token does not allow the "${operation}" operation`,
				details: {
					planId: parsed.data.planId,
					resourceId: parsed.data.resourceId,
					allowedOperations,
				},
			});
		}

		req.key0Token = parsed.data;
		return next();
	};
}
