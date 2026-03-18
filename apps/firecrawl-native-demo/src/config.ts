import { formatEnvError, parseEnv } from "@key0-demos/shared";
import type { NetworkName } from "@key0ai/key0";
import { z } from "zod";

const envSchema = {
	PORT: z.coerce.number().int().positive().default(3100),
	PUBLIC_URL: z.string().url().default("http://localhost:3100"),
	PROVIDER_NAME: z.string().min(1).default("Key0 Demos"),
	PROVIDER_URL: z.string().url().default("https://github.com/f0rr0/key0-demos"),
	REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
	FIRECRAWL_API_KEY: z.string().default(""),
	FIRECRAWL_BASE_URL: z.string().url().default("https://api.firecrawl.dev"),
	FIRECRAWL_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(90),
	FIRECRAWL_POLL_INTERVAL_SECONDS: z.coerce.number().int().positive().default(2),
	KEY0_NETWORK: z.enum(["mainnet", "testnet"]).default("testnet"),
	KEY0_WALLET_ADDRESS: z
		.string()
		.regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid EVM wallet address"),
	KEY0_ACCESS_TOKEN_SECRET: z.string().min(32),
	KEY0_RPC_URL: z.string().url().optional(),
};

type ParsedEnv = z.infer<z.ZodObject<typeof envSchema>>;

export type AppEnv = ParsedEnv & {
	KEY0_NETWORK: NetworkName;
};

export function loadEnv(): AppEnv {
	try {
		const env = parseEnv(envSchema);

		if (env.FIRECRAWL_BASE_URL.includes("api.firecrawl.dev") && !env.FIRECRAWL_API_KEY) {
			throw new Error(
				"FIRECRAWL_API_KEY is required when FIRECRAWL_BASE_URL points to the Firecrawl cloud API",
			);
		}

		return env;
	} catch (error) {
		throw new Error(`Invalid firecrawl-native-demo environment:\n${formatEnvError(error)}`);
	}
}
