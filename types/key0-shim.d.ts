declare module "@key0ai/key0" {
	export type NetworkName = "mainnet" | "testnet";

	export type TokenClaims = {
		sub: string;
		jti: string;
		resourceId: string;
		planId: string;
		txHash: string;
		[key: string]: unknown;
	};

	export type TokenIssuanceResult = {
		token: string;
		tokenType?: string;
		expiresAt?: string;
	};

	export type Plan = {
		planId: string;
		unitAmount: string;
		description?: string;
	};

	export type AccessGrant = {
		challengeId: string;
		planId: string;
		resourceId: string;
		txHash: string;
		explorerUrl: string;
	};

	export type SellerConfig = {
		agentName: string;
		agentDescription: string;
		agentUrl: string;
		providerName?: string;
		providerUrl?: string;
		walletAddress: `0x${string}`;
		network: NetworkName;
		mcp?: boolean;
		challengeTTLSeconds?: number;
		resourceEndpointTemplate?: string;
		plans: readonly Plan[];
		fetchResourceCredentials: (params: {
			requestId: string;
			challengeId: string;
			resourceId: string;
			planId: string;
			txHash: string;
		}) => Promise<TokenIssuanceResult> | TokenIssuanceResult;
		onPaymentReceived?: (grant: AccessGrant) => Promise<void> | void;
	};

	export class AccessTokenIssuer {
		constructor(secret: string);
		sign(claims: TokenClaims, ttlSeconds: number): TokenIssuanceResult;
	}

	export class RedisChallengeStore {
		constructor(opts: { redis: unknown });
		healthCheck(): Promise<void>;
	}

	export class RedisSeenTxStore {
		constructor(opts: { redis: unknown });
	}

	export class X402Adapter {
		constructor(opts: { network: NetworkName; rpcUrl?: string });
	}
}

