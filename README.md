# key0-demos

Public demo suite for Key0. Each demo is a seller-facing integration that showcases
discovery, pricing, payment, credential issuance, and direct resource access.

## Principles

- Discovery first, not checkout first
- Native seller integration over bolt-on resale wrappers
- Minimal moving parts beyond the integration itself
- Bun-first developer experience with current TypeScript tooling

## Workspace Layout

```text
apps/
  firecrawl-native-demo/   First live demo: Firecrawl + Key0
packages/
  shared/                  Shared env + runtime utilities
docs/
  demos/                   Implementation plans and launch docs
```

New demos should follow the same pattern:

- `apps/<demo-name>` for the runnable seller surface
- `packages/shared` for cross-demo runtime helpers
- `docs/demos/<demo-name>-implementation-plan.md` for the concrete build and launch plan

## Tooling

- `bun` for runtime, workspaces, and tests
- `biome` for formatting and linting
- `tsgo` via `@typescript/native-preview` for a native-compiler smoke suite
- `lefthook` for local automation

## Quick Start

```bash
bun install
cp apps/firecrawl-native-demo/.env.example apps/firecrawl-native-demo/.env
docker compose up -d redis
bun run dev:firecrawl
```

Then visit:

- `http://localhost:3100/discovery`
- `http://localhost:3100/.well-known/agent.json`
- `http://localhost:3100/mcp`
- `http://localhost:3100/x402/access`

## Current Demos

- [`firecrawl-native-demo`](./apps/firecrawl-native-demo)  
  A seller-native Key0 integration around Firecrawl capabilities:
  `single-url-scrape`, `site-crawl`, and `web-search`.

## Primary Doc

- [`docs/demos/firecrawl-native-implementation-plan.md`](./docs/demos/firecrawl-native-implementation-plan.md)
