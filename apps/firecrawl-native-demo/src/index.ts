import "dotenv/config";
import Redis from "ioredis";
import { createFirecrawlNativeDemoApp } from "./app";
import { loadEnv } from "./config";

const env = loadEnv();
const redis = new Redis(env.REDIS_URL);
const app = createFirecrawlNativeDemoApp({ env, redis });

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
