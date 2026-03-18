# firecrawl-native-demo

Seller-native Key0 demo for Firecrawl-backed capabilities.

This service is the seller surface. Key0 handles discovery, pricing, payment, and
credential issuance. The protected Firecrawl-backed routes stay direct and useful.

## Routes

- `GET /discovery`
- `GET /.well-known/agent.json`
- `GET /mcp`
- `POST /mcp`
- `POST /x402/access`
- `POST /api/firecrawl/scrape`
- `POST /api/firecrawl/crawl`
- `POST /api/firecrawl/search`

## Local Run

```bash
cp .env.example .env
docker compose up -d redis
bun run dev
```

## Demo Flow

1. An agent discovers the plan catalog through Key0.
2. It chooses one of `single-url-scrape`, `site-crawl`, or `web-search`.
3. It pays through `/x402/access`.
4. Key0 issues a scoped bearer token.
5. The agent calls the protected Firecrawl-backed route directly.
