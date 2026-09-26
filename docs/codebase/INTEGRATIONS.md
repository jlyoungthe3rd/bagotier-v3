# External Integrations

## Core Sections (Required)

### 1) Integration Inventory

| System                                          | Type (API/DB/Queue/etc)  | Purpose                                                                            | Auth model    | Criticality | Evidence                                                            |
| ----------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------- | ------------- | ----------- | ------------------------------------------------------------------- |
| GitHub Pages / Netlify / Vercel                 | Static Web Hosting / CDN | Serves the bundled HTML, CSS, and JavaScript assets                                | None (Public) | High        | `.github/workflows/deploy-pages.yml`, `netlify.toml`, `vercel.json` |
| GitHub Repository (`jlyoungthe3rd/bagotier-v3`) | External Link            | Outbound navigation link in header to project source code                          | None          | Low         | `src/features/github/GitHubLink.tsx`                                |
| Local Mock API (`src/mocks/api.ts`)             | In-Memory Client Service | Supplies initial character profiles and item catalogs with simulated 150ms latency | None          | High        | `src/mocks/api.ts`                                                  |

> [!NOTE]
> Bagotier V3 is a 100% frontend client application. It does not integrate with any external REST/GraphQL backends, third-party authentication services, SQL/NoSQL cloud databases, or messaging queues.

### 2) Data Stores

| Store                       | Role                                                                                                                    | Access layer                     | Key risk                                   | Evidence                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------ | -------------------------------- |
| React Query In-Memory Cache | Master entity store for item definitions and base character stats                                                       | `src/features/*/use*Query.ts`    | Ephemeral; state clears on browser reload  | `src/lib/queryClient.ts`         |
| Zustand In-Memory Store     | Session state (equipped slot mappings, unequipped item set, active fan-out slot, focused fan-out index, focus tracking) | `src/store/useInventoryStore.ts` | Ephemeral; not persisted to `localStorage` | `src/store/useInventoryStore.ts` |

### 3) Secrets and Credentials Handling

- Credential sources: None. The application requires zero API tokens, authentication secrets, or database credentials.
- Hardcoding checks: Verified clean. No environment secrets, API tokens, or private credentials are embedded in code or git history.
- Rotation or lifecycle notes: [TODO] Not applicable (no credentials managed).

### 4) Reliability and Failure Behavior

- Retry/backoff behavior: `QueryClient` defaults to `retry: 1` with `staleTime: Infinity` (`src/lib/queryClient.ts`), preventing perpetual loading spinners if queries fail.
- Timeout policy: [TODO] No fetch timeout is configured for local mock latency.
- Circuit-breaker or fallback behavior:
  - Query failure in `App.tsx` activates an `ErrorScreen` component allowing user to manually trigger a query refetch (`onRetry`).

### 5) Observability for Integrations

- Logging around external calls: No external network calls exist to log. Development logging in `src/lib/devLog.ts` logs local state-update timings against the 100ms performance budget.
- Metrics/tracing coverage: No external APM (e.g. Datadog, New Relic) or client error tracking (e.g. Sentry) is integrated.
- Missing visibility gaps:
  - No remote telemetry for unhandled client errors or failed static asset loads in production.
  - No Core Web Vitals tracking in production environments.

### 6) Evidence

- `src/mocks/api.ts`
- `src/lib/queryClient.ts`
- `src/App.tsx`
- `.github/workflows/deploy-pages.yml`
- `netlify.toml`
- `vercel.json`
