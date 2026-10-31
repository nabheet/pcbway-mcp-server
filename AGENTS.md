# AGENTS.md

Guide for AI agents working in this repository.

## Project

TypeScript MCP server exposing the PCBWay Partner API to AI assistants: PCB
quotes, SMT assembly quotes, order lifecycle, shipping costs, account balance.
Package name `pcbway-mcp-server`, executable `pcbway-mcp`. ESM
(`"type": "module"`), Node16 module resolution, target ES2022.

## Architecture

```text
src/
  index.ts                # bin entry: stdio server, TOOLS registry, dispatch
  config.ts               # env/.env loading -> Config (PCBWAY_API_KEY required)
  client.ts               # POST-only fetch client: api-key header, retries, backoff
  types.ts                # TypeScript interfaces mirroring the PCBWay API
  enums.ts                # ShipType / material / surface-finish enums
  resources/
    common.ts             # PCB_DEFAULTS: null-fill for optional advanced fields
    PcbQuote.ts           # POST /api/Pcb/PcbQuotation
    SmtQuote.ts           # POST /api/SMT/SMTQuotation
    OrderProcess.ts       # POST /api/Pcb/QueryOrderProcess
    OrderDetails.ts       # POST /api/Pcb/CheckOrderDetails
    Shipping.ts           # POST /api/Pcb/GetFreightByOrder
    Account.ts            # POST /api/Account/QueryBalance
    PlaceOrder.ts / ConfirmOrder.ts / CancelOrder.ts
    CheckTGroupOrder.ts / PayTGroupOrder.ts / CancelTGroupOrder.ts
    CheckGroupOrder.ts
    GetCountries.ts / GetStates.ts / GetCities.ts
  __tests__/              # vitest suites (client, config, resources, schemas)
```

Data flow: MCP tool call → `index.ts` switch → resource class method →
`PcbWayClient.request()` → PCBWay API → resource formats markdown → tool result
`{ content: [{ type: "text", text }] }`.

## Conventions

- **Import style**: `.js` extensions in relative imports (Node16). Tests live
  in `src/__tests__/` and import `../...`.
- **New endpoint**: add the response/request interfaces to `types.ts`, a class
  in `src/resources/`, register a `Tool` in `index.ts`, and cover it in
  `src/__tests__/resources.test.ts` + `schemas.test.ts`.
- **Optional PCB fields**: never hand-write the ~40 null-fill fields — spread
  `PCB_DEFAULTS` from `resources/common.ts`.
- **Client errors**: `PcbWayClient` already retries transient failures and
  throws typed errors; resources do not retry again.
- **Zod schemas**: tool inputs are validated with Zod; the schema tests assert
  every documented argument is accepted and required ones are enforced.
- **No secrets**: never commit or log `PCBWAY_API_KEY`. Tests use fake keys.

## Commands

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # biome check . && markdownlint-cli2 (CI enforces this)
npm run lint:fix     # biome check --write . && markdownlint-cli2 --fix
npm test             # vitest run
npm run check        # typecheck + lint + test
npm run build        # tsc -> dist/
node dist/index.js --help
```

**Do not run `rtk lint`** in this repo (or `npm run lint` through the `rtk`
wrapper): `rtk`'s `lint` subcommand wraps ESLint, and this repo has no ESLint
config — it lints with Biome. Use the npm scripts, or `npx biome check .`
directly.

Biome's markdown formatter is disabled in `biome.json` and markdown tables are
exempt from MD013: a table cell cannot be wrapped, and biome 2.6 aligns table
columns, which would push lines past the limit. Markdownlint stays the markdown
authority; Biome covers code.

## Releases (CI only)

Publishing happens only from GitHub Actions via npm **trusted publishing**
(OIDC provenance) — no local npm login or token, never publish by hand.

`.github/workflows/ci.yml` is the single workflow file (npm allows one trusted
publisher per package; the filename must stay `ci.yml`):

- `test` — typecheck + lint + tests + build on `main` and PRs (Node 24).
- push to `main` → `publish` publishes the next patch to `latest`, pushes
  `vX.Y.Z`, and opens a GitHub release.
- The publish job's first step implements the **release rule**: publish UNLESS
  every path changed since the newest stable `v*` tag is non-shipping.
  Non-shipping = `package-lock.json`, `.github/**`, and a `package.json` whose
  only diffs are the version and/or the inert devDependencies (`@types/node`,
  `vitest`, `@vitest/coverage-v8`). `typescript` is deliberately **not** inert:
  it compiles `dist/`, which is what ships. A non-shipping push produces no
  build, no publish, no tag, no release.
- The baseline is the last release tag rather than the push's `before`, so a
  shipping change whose publish failed is retried by the next run instead of
  waiting for the next shipping merge. The publish checkout therefore needs
  `fetch-depth: 0`.
- `v*-beta*` tag push → `beta` channel + prerelease GitHub release.
- Every PR push → `prerelease` job publishes
  `<version>-beta.<run_number>` to the `beta` dist-tag (same-repo, non-draft,
  non-dependabot PRs; re-runs deduped). `beta` is a preview channel and can
  hold unmerged branch code.
- `workflow_dispatch` → staging beta build from `main`.

The version is derived from the npm registry (`latest` + patch), not from
`package.json`, so repeated merges cannot collide; an intentional minor/major
bump in `package.json` is honored.
