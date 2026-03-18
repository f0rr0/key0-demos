# Firecrawl Native Demo Implementation Plan

## Target Outcome

Ship a public demo that proves Key0's core thesis:

1. An agent can discover a seller's capabilities with no pre-shared context.
2. The agent can choose the right plan for the job.
3. The agent can pay for access through Key0.
4. The seller's API is then used directly with the issued credential.

This is not a generic "paid API" demo. It is a seller-native commerce demo with
discovery as the first step.

## Demo Choice

We are building a **Firecrawl-native Key0 demo**. Firecrawl is a useful, high-signal
seller surface because the capabilities are instantly legible:

- `single-url-scrape`
- `site-crawl`
- `web-search`

The demo service integrates Key0 into the seller's API boundary. It does not add an
invented product layer, a separate billing system, or a custom discovery system.

## Constraint Summary

- The demo lives in this separate `key0-demos` repository.
- Future demos should fit the same workspace pattern.
- The implementation must feel current and production-minded:
  Bun, Biome, tsgo, Lefthook, strict TypeScript.
- The demo should support real use after launch, not just a mocked flow.
- We should avoid deprecated Firecrawl features in the main demo path.

## Architecture

```text
Agent Client
  -> /.well-known/agent.json | /discovery | /mcp
  -> /x402/access
  -> /api/firecrawl/:operation

Key0 Demo Server
  - Key0 router + plan catalog
  - x402 settlement + access-token issuance
  - token validation on protected routes
  - direct forwarding into Firecrawl operations

Infra
  - Redis for Key0 challenge + replay protection
  - Firecrawl endpoint
      - Cloud API for fastest initial delivery
      - Self-hosted Firecrawl-compatible endpoint later
```

## Why This Is Still Seller-Native

For the public demo repository, the service is the seller surface. Key0 is mounted on
the same API that exposes the Firecrawl-backed operations. The integration pattern is
the same one a first-party Firecrawl seller integration would use:

- mount discovery and commerce routes
- protect real operations
- issue scoped credentials after payment

We are not building extra seller logic beyond the integration itself.

## Repository Shape

```text
apps/
  firecrawl-native-demo/
    src/
      app.ts
      auth.ts
      config.ts
      firecrawl-client.ts
      http.ts
      index.ts
      plan-catalog.ts
packages/
  shared/
docs/
  demos/
    firecrawl-native-implementation-plan.md
```

This keeps each future demo isolated at the app level while letting us reuse runtime
helpers and repo-wide tooling.

## Initial Scope

### Included

- Monorepo scaffold for multiple future demos
- Shared env/runtime utilities
- Firecrawl-native demo service
- Key0 discovery routes
- Key0 MCP exposure
- Key0 x402 payment flow
- Redis-backed challenge and replay state
- Protected Firecrawl-backed routes:
  - `POST /api/firecrawl/scrape`
  - `POST /api/firecrawl/crawl`
  - `POST /api/firecrawl/search`
- Local developer workflow
- CI and git hooks
- Full-repo typechecking through `tsgo`

### Explicitly Deferred

- UI dashboard
- Demo frontend
- Seller analytics
- Multi-demo orchestration tooling
- Self-hosted Firecrawl automation beyond documented compatibility

## Implementation Targets

### Seller Surface

- `GET /`
- `GET /healthz`
- `GET /discovery`
- `GET /.well-known/agent.json`
- `GET /mcp`
- `POST /mcp`
- `POST /x402/access`
- `POST /api/firecrawl/scrape`
- `POST /api/firecrawl/crawl`
- `POST /api/firecrawl/search`

### Shared Infra

- Redis for challenge state and replay protection
- Firecrawl cloud API for day-one delivery
- `FIRECRAWL_BASE_URL` override for self-host or compatible deployments

## Plan Catalog

| Plan ID | Resource ID | Price | Capability |
| --- | --- | --- | --- |
| `single-url-scrape` | `scrape` | `$0.03` | Scrape one URL into markdown/html/links |
| `site-crawl` | `crawl` | `$0.12` | Crawl a docs or marketing site |
| `web-search` | `search` | `$0.07` | Search the web and optionally scrape result pages |

Each plan issues a scoped JWT that allows exactly one Firecrawl operation.

## Exact Build Tasks

### Phase 1: Repo Convergence

- Keep `apps/firecrawl-native-demo` as the runnable seller surface
- Keep `packages/shared` as the first shared runtime package
- Keep one implementation-plan document under `docs/demos/`

### Phase 2: Tooling

- Bun workspaces at the repo root
- Biome for formatting and linting
- Lefthook for pre-commit and pre-push automation
- `tsgo` for full repo typechecking
- GitHub Actions CI running `bun run check`

### Phase 3: Seller-Native Integration

- Define the Firecrawl plan catalog
- Parse env and support cloud plus custom base URL mode
- Mount Key0 discovery, MCP, and x402 routes on the same service
- Issue short-lived Key0 access tokens scoped by plan and `resourceId`
- Validate the issued token on the protected Firecrawl routes
- Reject route usage when the token plan/resource does not match the seller catalog

### Phase 4: Validation

- Unit test the plan catalog mapping
- Unit test authz for route-to-plan matching
- Run lint, `tsgo`, and tests

## Environment

Required for cloud mode:

- `FIRECRAWL_API_KEY`
- `KEY0_WALLET_ADDRESS`
- `KEY0_ACCESS_TOKEN_SECRET`

Required locally:

- `REDIS_URL`
- `PUBLIC_URL`
- `KEY0_NETWORK`

Optional:

- `FIRECRAWL_BASE_URL`
- `KEY0_RPC_URL`

## Demo Flow

1. Agent starts from Key0 discovery.
2. Agent sees the plan catalog.
3. Agent selects a plan based on the task.
4. Agent buys access.
5. Agent receives `resourceEndpoint` and `Bearer` token.
6. Agent calls the protected Firecrawl-backed endpoint directly.
7. Demo returns live web data.

## Live Demo Prompt

Use a task that forces capability selection:

> Compare the pricing and feature summaries of three AI devtools sites and return a structured summary.

This gives the agent a reason to choose between:

- `web-search` when it does not know the URLs yet
- `single-url-scrape` when URLs are already known
- `site-crawl` when one site needs deeper traversal

## Demo Script

1. Start with a clean agent client connected only to the public MCP endpoint.
2. Ask for a task that requires capability selection.
3. Show the agent discovering the available plans.
4. Show it selecting one plan instead of using a hard-coded endpoint.
5. Show the x402 payment and issued credential.
6. Show the direct call to `/api/firecrawl/<resourceId>`.
7. Return real structured output from live Firecrawl-backed data.

## Acceptance Criteria

- `bun install` succeeds cleanly
- `bun run lint` passes
- `bun run typecheck` passes
- `bun test` passes
- Demo service boots with Redis + env configured
- `/discovery` returns the Firecrawl plan catalog
- `/mcp` is mounted by Key0
- Protected Firecrawl routes reject missing or invalid tokens
- Protected Firecrawl routes accept valid Key0-issued tokens

## Current Status

- Repo scaffold: complete
- Firecrawl-native service: complete
- Validation suite: complete
- Public deployment: pending seller wallet and Firecrawl credentials

## Deployment Path

### Day 1

- Publish the repo
- Run the service publicly against the Firecrawl cloud API
- Capture the demo video

### Day 2

- List or announce it through Key0/x402 channels
- Post a thread with the full discovery -> payment -> access flow

### Day 3

- Add a second demo in the same monorepo using the same shared scaffolding

## Known Risk

Firecrawl's upstream repository states that the monorepo is still evolving for
self-hosted deployment, although it can be run locally. The demo should therefore
keep Firecrawl connectivity provider-agnostic:

- use cloud mode immediately
- support a compatible `FIRECRAWL_BASE_URL` override for self-host or local modes
