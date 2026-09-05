# Codebase Structure

## Core Sections (Required)

### 1) Top-Level Map

| Path                              | Purpose                                                                                                                                                  | Evidence                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/`                            | Primary application source code containing UI features, state, types, and mocks                                                                          | `src/main.tsx`, `src/App.tsx`                                                   |
| `src/features/`                   | Feature-sliced components, hooks, and domain-specific logic                                                                                              | `src/features/`                                                                 |
| `src/features/audio/`             | Web Audio sound player, sound effect registry, and mute controls                                                                                         | `src/features/audio/useSound.ts`                                                |
| `src/features/banner/`            | Header notification and work-in-progress banner                                                                                                          | `src/features/banner/WipBanner.tsx`                                             |
| `src/features/character/`         | SVG paper doll figure, spatial equipment slots, horizontal fan-out inspector (`FanOut.tsx`), hover delay manager (`slotHoverManager.ts`), and stat panel | `src/features/character/CharacterView.tsx`, `src/features/character/FanOut.tsx` |
| `src/features/github/`            | Header repository link with GitHub SVG icon                                                                                                              | `src/features/github/GitHubLink.tsx`                                            |
| `src/features/inventory/`         | Equipped inventory item tiles, keyboard navigation, query cache hooks, and floating tooltip integration                                                  | `src/features/inventory/InventoryItem.tsx`                                      |
| `src/features/inventory/tooltip/` | Floating UI presentation, placement, and tooltip lifecycle state machine                                                                                 | `src/features/inventory/tooltip/ItemTooltipPresenter.tsx`                       |
| `src/lib/`                        | Shared infrastructure utilities (React Query client factory, centralized query keys, dev logger)                                                         | `src/lib/queryClient.ts`, `src/lib/queryKeys.ts`                                |
| `src/mocks/`                      | Mock item catalog, mock character profile, and simulated async API latency                                                                               | `src/mocks/items.ts`, `src/mocks/character.ts`, `src/mocks/api.ts`              |
| `src/store/`                      | Zustand session store and decoupled pure state transition functions                                                                                      | `src/store/useInventoryStore.ts`                                                |
| `src/types/`                      | Domain TypeScript interfaces, branded types, and runtime Zod validation schemas                                                                          | `src/types/domain.ts`, `src/types/schemas.ts`                                   |
| `public/sounds/`                  | Public domain audio tone assets (`equip.wav`, `unequip.wav`, `pickup.wav`, `invalid.wav`)                                                                | `public/sounds/`                                                                |
| `docs/`                           | Project documentation, feature specifications, backlog, and codebase maps                                                                                | `docs/specifications.md`, `docs/feature_todos.md`                               |
| `tests/`                          | Three-tier test suite (contract, unit, integration) with Vitest and React Testing Library                                                                | `tests/`                                                                        |
| `.github/workflows/`              | CI/CD automation workflows (Pages deployment and PR preview verification)                                                                                | `.github/workflows/deploy-pages.yml`, `.github/workflows/pr-preview.yml`        |

### 2) Entry Points

- Main runtime entry: `index.html` → `src/main.tsx`, which instantiates `QueryClientProvider` and renders `<App />` into the `#root` DOM node.
- Secondary entry points: None (pure single-page web client; no CLI or worker processes).
- How entry is selected: Vite build pipeline defaults to `index.html` as the SPA entry point (`vite.config.ts`).

### 3) Module Boundaries

| Boundary                          | What belongs here                                                                                                                               | What must not be here                                                                                         |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/store/`                      | Session/UI state (equipped slot mappings, unequipped item set, active fan-out slot, focused fan-out index, audio mute, focus, pure transitions) | Must never hold full `Item` entity objects (invariant I5); no direct DOM or audio side effects in transitions |
| `src/features/*/use*Query.ts`     | TanStack Query fetch hooks, cache selectors (`useItem`), and server-state lifecycle                                                             | Must not manage transient UI session state (mute toggle, focus, active fan-out)                               |
| `src/types/`                      | Core domain interfaces, branded primitives (`ItemId`), and Zod validation schemas                                                               | Must not contain UI components, hook implementations, or framework dependencies                               |
| `src/features/audio/`             | Web Audio context management, asset preloading, and sound playback                                                                              | Must not perform inventory business logic or state transitions                                                |
| `src/features/inventory/tooltip/` | Floating UI positioning, hover/focus coordination, and tooltip DOM rendering                                                                    | Must not mutate inventory or character data                                                                   |

### 4) Naming and Organization Rules

- File naming pattern:
  - React components: PascalCase with `.tsx` extension (`CharacterView.tsx`, `FanOut.tsx`, `EquipmentSlot.tsx`, `StatPanel.tsx`).
  - Stores and hooks: camelCase starting with `use` (`useInventoryStore.ts`, `useSound.ts`, `useInventoryQuery.ts`).
  - Utilities and domain files: camelCase (`keyboard.ts`, `devLog.ts`, `domain.ts`, `schemas.ts`).
  - Test files: kebab-case with `.test.ts` or `.test.tsx` suffix (`character-view.test.tsx`, `keyboard-nav.test.ts`, `store-equip.test.ts`).
- Directory organization pattern: Feature-sliced architecture within `src/features/` complemented by domain/infrastructure modules in `src/lib/`, `src/mocks/`, `src/store/`, and `src/types/`.
- Import aliasing or path conventions: Relative imports (`./` and `../`); no path aliases configured in `tsconfig.json` or `vite.config.ts`.

### 5) Evidence

- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/store/useInventoryStore.ts`
- `src/types/domain.ts`
- `src/types/schemas.ts`
- `tests/integration/character-view.test.tsx`
- `vite.config.ts`
