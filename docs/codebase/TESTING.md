# Testing Patterns

## Core Sections (Required)

### 1) Test Stack and Commands

- Primary test framework: Vitest 4.1.10 (`vitest`, `package.json`)
- Assertion/mocking tools:
  - `@testing-library/react` (v16.3.2)
  - `@testing-library/jest-dom` (v6.9.1)
  - `@testing-library/user-event` (v14.6.1)
  - `jsdom` (v29.1.1) headless DOM environment
  - Vitest built-in `vi` mocking and spy utilities
- Commands:

```bash
npm test                                           # Execute full test suite once (vitest run)
npm run test:watch                                 # Start interactive test watcher
npm run test:coverage                              # Run Vitest with native V8 code coverage report
npx vitest run tests/contract                      # Run schema and invariant contract tests
npx vitest run tests/unit                          # Run pure unit tests
npx vitest run tests/integration                   # Run component integration tests
npx vitest run tests/unit/stats.test.ts            # Run a single target test file
```

### 2) Test Layout

- Test file placement pattern: Centralized `tests/` root directory divided strictly into three architectural tiers:
  - `tests/contract/`: Validates schemas, catalog constraints, and architectural boundaries.
  - `tests/unit/`: Tests pure domain functions, math, state transitions, and hooks without React rendering.
  - `tests/integration/`: Mounts full component trees in jsdom to verify user interaction and accessibility flows.
- Naming convention: kebab-case with `.test.ts` for logic tests and `.test.tsx` for component tests (`character-view.test.tsx`, `store-equip.test.ts`, `keyboard-nav.test.ts`).
- Setup files and where they run: `tests/setup.ts` executed before each test file via `setupFiles: ['./tests/setup.ts']` in `vitest.config.ts`. Initializes `@testing-library/jest-dom/matchers` and invokes automatic RTL cleanup after each test.

### 3) Test Scope Matrix

| Scope       | Covered? | Typical target                                                                                                | Notes                                                                                                                                          |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Contract    | Yes      | Zod schemas, mock catalogs, invariant I5 validation                                                           | Asserts catalog has ≥10 items covering all 7 slots (`items.contract.test.ts`) and store contains no `Item` objects (`store.contract.test.ts`). |
| Unit        | Yes      | `equipTransition`, `swapTransition`, `unequipTransition`, `computeEffectiveStats`, `useSound`                 | Tests pure transitions with zero React overhead (`tests/unit/`).                                                                               |
| Integration | Yes      | Full view rendering (`App`, `CharacterView`, `InventoryGrid`, `StatPanel`), keyboard navigation, sound firing | Simulates user clicks and keyboard navigation via RTL and user-event (`tests/integration/`).                                                   |
| E2E         | No       | [TODO] Real browser automation (Playwright/Cypress)                                                           | Not configured; all integration testing relies on jsdom.                                                                                       |

### 4) Mocking and Isolation Strategy

- Main mocking approach:
  - State Reset: `useInventoryStore.getState().reset()` resets Zustand state between tests.
  - QueryClient Isolation: `renderApp()` instantiates an isolated `QueryClient` with `staleTime: Infinity` and `retry: false`.
  - Audio Spies: Spies on `audioEngine.playback` rather than instantiating browser AudioContext; `__resetAudioForTests()` flushes module caches.
  - Deterministic Coordinates: `installLayout()` in `tests/integration/dnd-test-utils.tsx` overrides `getBoundingClientRect` with fixed cell/slot geometries.
- Isolation guarantees: Complete memory isolation between test files; global mocks are cleaned up after each test execution.
- Common failure mode in tests:
  - React 19 `act(...)` warning outputs in test logs during asynchronous query resolution or state updates.
  - Layout-dependent tests failing if `installLayout()` is omitted in jsdom.

### 5) Coverage and Quality Signals

- Coverage tool + threshold: `@vitest/coverage-v8` (v4.1.11). Running in informational mode without blocking thresholds, generating terminal text summary and HTML reports in `coverage/`. Excludes `src/main.tsx`, `src/mocks/**`, and `src/vite-env.d.ts`.
- Current reported coverage:
  - Statements: 93.04%
  - Branches: 84.87%
  - Functions: 95.80%
  - Lines: 93.61%
  - Core domain models & pure transitions (`domain.ts`, `schemas.ts`, `stats.ts`, `InventoryItem.tsx`): 100% lines/branches.
- Known gaps/flaky areas:
  - Current suite consists of 27 test files and 89 tests; all 89 tests pass consistently.
  - Legacy comments in `tests/integration/dnd-test-utils.tsx` refer to dnd-kit KeyboardSensors even though dnd-kit was uninstalled.
  - TypeScript `composite` mode reports TS2742 when `renderApp` in `dnd-test-utils.tsx` lacks an explicit return type in symlinked build environments.

### 6) Evidence

- `package.json`
- `vitest.config.ts`
- `tests/setup.ts`
- `tests/contract/items.contract.test.ts`
- `tests/contract/store.contract.test.ts`
- `tests/unit/store-equip.test.ts`
- `tests/integration/dnd-test-utils.tsx`
- `tests/integration/character-view.test.tsx`
