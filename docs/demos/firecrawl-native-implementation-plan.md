# Firecrawl Native Demo Implementation Plan

## Target Outcome

Ship a public demo that proves Key0's core thesis:

1. An agent can discover a seller's capabilities with no pre-shared context.
2. The agent can choose the right plan for the job.
3. The agent can pay for access through Key0.
4. The seller's API is then used directly with the issued credential.

This is not a generic "paid API" demo. It is a seller-native commerce demo.

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
- The demo should support **real use** after launch, not just a mocked flow.
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

### Explicitly Deferred

- UI dashboard
- Demo frontend
- Seller analytics
- Multi-demo orchestration tooling
- Self-hosted Firecrawl automation beyond documented compatibility

## Plan Catalog

| Plan ID | Resource ID | Price | Capability |
| --- | --- | --- | --- |
| `single-url-scrape` | `scrape` | `$0.03` | Scrape one URL into markdown/html/links |
| `site-crawl` | `crawl` | `$0.12` | Crawl a docs or marketing site |
| `web-search` | `search` | `$0.07` | Search the web and optionally scrape result pages |

Each plan issues a scoped JWT that allows exactly one Firecrawl operation.

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

## Repository Structure

```text
apps/
  firecrawl-native-demo/
packages/
  shared/
docs/
  demos/
```

## Execution Plan

### Phase 1: Repo and Tooling

- Initialize Bun workspaces
- Add Biome, tsgo, Lefthook, CI
- Add shared package

### Phase 2: Demo Service

- Configure env parsing
- Define plan catalog
- Create Firecrawl client wrapper
- Mount Key0 with MCP enabled
- Add protected seller routes
- Add authz middleware per operation

### Phase 3: Developer Experience

- Add env example
- Add Redis compose file
- Add quickstart docs

### Phase 4: Validation

- Lint
- Typecheck with `tsc`
- Typecheck with `tsgo`
- Add at least lightweight unit coverage for catalog/authz logic

## Acceptance Criteria

- `bun install` succeeds cleanly
- `bun run lint` passes
- `bun run typecheck` passes
- `bun run typecheck:native` passes
- `bun test` passes
- Demo service boots with Redis + env configured
- `/discovery` returns the Firecrawl plan catalog
- `/mcp` is mounted by Key0
- Protected Firecrawl routes reject missing/invalid tokens
- Protected Firecrawl routes accept valid Key0-issued tokens

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
