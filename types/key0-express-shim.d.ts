declare module "@key0ai/key0/express" {
	import type { RequestHandler, Router } from "express";
	import type { SellerConfig } from "@key0ai/key0";

	export function key0Router(opts: {
		config: SellerConfig;
		adapter: unknown;
		store: unknown;
		seenTxStore: unknown;
	}): Router;

	export function validateAccessToken(config: {
		secret: string;
	}): RequestHandler;
}
