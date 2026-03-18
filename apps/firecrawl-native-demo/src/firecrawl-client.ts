import Firecrawl from "@mendable/firecrawl-js";
import type { AppEnv } from "./config";

export function createFirecrawlClient(env: AppEnv) {
	return new Firecrawl({
		apiKey: env.FIRECRAWL_API_KEY,
		apiUrl: env.FIRECRAWL_BASE_URL,
	});
}
