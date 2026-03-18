import "dotenv/config";
import {
	AccessTokenIssuer,
	RedisChallengeStore,
	RedisSeenTxStore,
	type TokenIssuanceResult,
	X402Adapter,
} from "@key0ai/key0";
import { key0Router, validateAccessToken } from "@key0ai/key0/express";
import express from "express";
import Redis from "ioredis";
import { ZodError } from "zod";
import type { Key0Request } from "./auth";
import { requireOperation } from "./auth";
import { loadEnv } from "./config";
import { createFirecrawlClient } from "./firecrawl-client";
import { crawlRequestSchema, scrapeRequestSchema, searchRequestSchema } from "./http";
import { getResourceIdForPlan, getTokenTtlForPlan, key0Plans } from "./plan-catalog";

const env = loadEnv();
const firecrawl = createFirecrawlClient(env);
const adapter = new X402Adapter({
	network: env.KEY0_NETWORK,
	...(env.KEY0_RPC_URL ? { rpcUrl: env.KEY0_RPC_URL } : {}),
});
const tokenIssuer = new AccessTokenIssuer(env.KEY0_ACCESS_TOKEN_SECRET);
const redis = new Redis(env.REDIS_URL);
const store = new RedisChallengeStore({ redis });
const seenTxStore = new RedisSeenTxStore({ redis });

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
	res.json({
		name: "firecrawl-native-demo",
		publicUrl: env.PUBLIC_URL,
		discovery: `${env.PUBLIC_URL}/discovery`,
		agentCard: `${env.PUBLIC_URL}/.well-known/agent.json`,
		mcp: `${env.PUBLIC_URL}/mcp`,
		x402: `${env.PUBLIC_URL}/x402/access`,
		protectedOperations: [
			`${env.PUBLIC_URL}/api/firecrawl/scrape`,
			`${env.PUBLIC_URL}/api/firecrawl/crawl`,
			`${env.PUBLIC_URL}/api/firecrawl/search`,
		],
	});
});

app.get("/healthz", async (_req, res) => {
	await store.healthCheck();
	res.json({
		ok: true,
		redis: "healthy",
		firecrawlBaseUrl: env.FIRECRAWL_BASE_URL,
	});
});

app.use(
	key0Router({
		config: {
			agentName: "Firecrawl Native Commerce Demo",
			agentDescription:
				"Discover, purchase, and use Firecrawl-backed scrape, crawl, and search operations through Key0.",
			agentUrl: env.PUBLIC_URL,
			providerName: env.PROVIDER_NAME,
			providerUrl: env.PROVIDER_URL,
			walletAddress: env.KEY0_WALLET_ADDRESS as `0x${string}`,
			network: env.KEY0_NETWORK,
			mcp: true,
			challengeTTLSeconds: 900,
			resourceEndpointTemplate: `${env.PUBLIC_URL}/api/firecrawl/{resourceId}`,
			plans: key0Plans,
			fetchResourceCredentials: async (params): Promise<TokenIssuanceResult> => {
				const resourceId = getResourceIdForPlan(params.planId);
				const ttl = getTokenTtlForPlan(params.planId);

				return tokenIssuer.sign(
					{
						sub: params.requestId,
						jti: params.challengeId,
						resourceId,
						planId: params.planId,
						txHash: params.txHash,
					},
					ttl,
				);
			},
			onPaymentReceived: async (grant) => {
				console.log(
					`[firecrawl-native-demo] paid ${grant.planId} for ${grant.resourceId}: ${grant.txHash}`,
				);
			},
		},
		adapter,
		store,
		seenTxStore,
	}),
);

app.use("/api/firecrawl", validateAccessToken({ secret: env.KEY0_ACCESS_TOKEN_SECRET }));

app.post("/api/firecrawl/scrape", requireOperation("scrape"), async (req: Key0Request, res) => {
	try {
		const body = scrapeRequestSchema.parse(req.body);
		const result = await firecrawl.scrape(body.url, {
			formats: body.formats,
			...(body.onlyMainContent !== undefined ? { onlyMainContent: body.onlyMainContent } : {}),
			...(body.waitFor !== undefined ? { waitFor: body.waitFor } : {}),
		});

		res.json({
			planId: (req.key0Token as { planId: string }).planId,
			operation: "scrape",
			result,
		});
	} catch (error) {
		sendRouteError(res, error);
	}
});

app.post("/api/firecrawl/crawl", requireOperation("crawl"), async (req: Key0Request, res) => {
	try {
		const body = crawlRequestSchema.parse(req.body);
		const result = await firecrawl.crawl(body.url, {
			limit: body.limit,
			maxDiscoveryDepth: body.maxDiscoveryDepth,
			pollInterval: env.FIRECRAWL_POLL_INTERVAL_SECONDS,
			timeout: env.FIRECRAWL_TIMEOUT_SECONDS,
			scrapeOptions: {
				formats: ["markdown"],
			},
			...(body.prompt ? { prompt: body.prompt } : {}),
		});

		res.json({
			planId: (req.key0Token as { planId: string }).planId,
			operation: "crawl",
			result,
		});
	} catch (error) {
		sendRouteError(res, error);
	}
});

app.post("/api/firecrawl/search", requireOperation("search"), async (req: Key0Request, res) => {
	try {
		const body = searchRequestSchema.parse(req.body);
		const result = await firecrawl.search(body.query, {
			limit: body.limit,
			...(body.scrapeResults
				? {
						scrapeOptions: {
							formats: ["markdown"],
						},
					}
				: {}),
		});

		res.json({
			planId: (req.key0Token as { planId: string }).planId,
			operation: "search",
			result,
		});
	} catch (error) {
		sendRouteError(res, error);
	}
});

const server = app.listen(env.PORT, () => {
	console.log(`\nfirecrawl-native-demo listening on ${env.PUBLIC_URL}`);
	console.log(`  discovery: ${env.PUBLIC_URL}/discovery`);
	console.log(`  agent card: ${env.PUBLIC_URL}/.well-known/agent.json`);
	console.log(`  mcp: ${env.PUBLIC_URL}/mcp`);
	console.log(`  x402: ${env.PUBLIC_URL}/x402/access`);
	console.log(`  protected scrape: ${env.PUBLIC_URL}/api/firecrawl/scrape`);
	console.log(`  protected crawl: ${env.PUBLIC_URL}/api/firecrawl/crawl`);
	console.log(`  protected search: ${env.PUBLIC_URL}/api/firecrawl/search\n`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.on(signal, async () => {
		server.close();
		await redis.quit();
		process.exit(0);
	});
}

function sendRouteError(res: express.Response, error: unknown) {
	if (error instanceof ZodError) {
		return res.status(400).json({
			type: "Error",
			code: "INVALID_REQUEST",
			message: "Request body did not match the expected schema",
			details: error.flatten(),
		});
	}

	if (error instanceof Error) {
		return res.status(500).json({
			type: "Error",
			code: "UPSTREAM_ERROR",
			message: error.message,
		});
	}

	return res.status(500).json({
		type: "Error",
		code: "UPSTREAM_ERROR",
		message: "Unknown route failure",
	});
}
