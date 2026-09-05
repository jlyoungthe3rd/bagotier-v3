# Coding Conventions

## Core Sections (Required)

### 1) Naming Rules

| Item                       | Rule                                      | Example                                                | Evidence                                   |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| Files (React Components)   | PascalCase with `.tsx` extension          | `CharacterView.tsx`, `InventoryGrid.tsx`               | `src/features/character/CharacterView.tsx` |
| Files (Stores & Utilities) | camelCase with `.ts` extension            | `useInventoryStore.ts`, `devLog.ts`, `keyboard.ts`     | `src/store/useInventoryStore.ts`           |
| Files (Tests)              | kebab-case with `.test.ts` or `.test.tsx` | `stat-panel.test.tsx`, `keyboard-nav.test.ts`          | `tests/integration/stat-panel.test.tsx`    |
| Functions & Methods        | camelCase                                 | `computeEffectiveStats`, `equipTransition`, `useSound` | `src/features/character/stats.ts`          |
| Types & Interfaces         | PascalCase                                | `Item`, `Character`, `ItemId`, `EquipmentState`        | `src/types/domain.ts`                      |
| Constants & Enums          | UPPER_SNAKE_CASE                          | `BAG_CAPACITY`, `SLOT_TYPES`, `STAT_KEYS`              | `src/types/domain.ts`                      |
| Environment Variables      | UPPER_SNAKE_CASE                          | `VITE_BASE`                                            | `vite.config.ts`, `netlify.toml`           |

### 2) Formatting and Linting

- Formatter: Prettier 3.9.5 configured in `.prettierrc`:
  - `singleQuote: true`
  - `trailingComma: 'all'`
  - `printWidth: 90`
  - `tabWidth: 2`
- Linter: ESLint 8.57.1 configured in `.eslintrc.cjs`:
  - Extends `eslint:recommended`, `plugin:@typescript-eslint/strict-type-checked`, `plugin:@typescript-eslint/stylistic-type-checked`, `plugin:react-hooks/recommended`, `prettier`
  - Strict type checking rules: `@typescript-eslint/consistent-type-imports: 'error'`
  - Zero warnings permitted during CI linting (`--max-warnings 0`)
- Most relevant enforced rules:
  - Strict TypeScript configuration (`strict: true`, `noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`, `noUnusedLocals: true`)
  - Explicit type imports mandatory for all TypeScript types (`import type { ... }`)
- Run commands:
  - `npm run lint` (`eslint . --max-warnings 0 && prettier --check .`)
  - `npm run format` (`prettier --write .`)

### 3) Import and Module Conventions

- Import grouping/order: External core packages first (`react`, `@tanstack/react-query`, `framer-motion`), followed by type imports (`import type`), then internal relative modules (`../../store/`, `../../types/`).
- Alias vs relative import policy: Explicit relative paths (`./` and `../`). No tsconfig path mapping aliases are used.
- Public exports/barrel policy: Barrel re-exports are limited to dedicated submodules (e.g. `src/features/inventory/tooltip/index.ts`). General feature components are imported directly from their respective source files. `App.tsx` uses default export; all feature components use named exports.

### 4) Error and Logging Conventions

- Error strategy by layer:
  - UI Data Fetch Errors: Catch errors at query boundary in `App.tsx` and render designed `ErrorScreen` with retry action.
  - State Invariants: Pure transition functions (`equipTransition`, `unequipTransition`) return deterministic immutable `EquipmentState`. Equipping into an occupied slot safely displaces the current item back to the `unequipped` Set; unequipping is infallible and returns the item to the `unequipped` Set without capacity errors.
  - Web Audio: AudioContext creation and asset loading wrapped in `try/catch`; fails gracefully to silent operation on unsupported browsers or autoplay restrictions.
- Logging style and required context fields: Production code enforces zero console logging via ESLint (`no-console`). Development logging is isolated in `src/lib/devLog.ts`, guarded by `import.meta.env.DEV`, logging performance metrics:
  ```text
  [inventory] drop outcome=${outcome} handled in ${elapsed.toFixed(1)}ms (${status}, budget ${budgetMs}ms)
  ```
- Sensitive-data redaction rules: [TODO] (Client-only application; no user PII, authentication tokens, or secrets are handled).

### 5) Testing Conventions

- Test file naming/location rule: All tests located in `tests/` categorized into three distinct folders:
  - `tests/contract/`: Schema validation (`*.contract.test.ts`)
  - `tests/unit/`: Pure logic functions without React runtime (`*.test.ts`, e.g. `fan-out.test.tsx`, `slot-hover-manager.test.ts`)
  - `tests/integration/`: Component interactions with jsdom (`*.test.tsx`)
- Mocking strategy norm:
  - Pure state isolation: Store reset called via `useInventoryStore.getState().reset()` before test runs.
  - React Query isolation: Tests instantiate fresh `QueryClient` instances with `retry: false` and `staleTime: Infinity`.
  - Audio mocking: Tests spy on `audioEngine.playback` or invoke `__resetAudioForTests()` to avoid audio buffer errors.
  - Layout mocking: `installLayout()` in `tests/integration/dnd-test-utils.tsx` overrides `getBoundingClientRect` for predictable coordinate calculations.
- Coverage expectation: Configured via `@vitest/coverage-v8` (`npm run test:coverage`), generating terminal and HTML reports while excluding `src/main.tsx`, `src/mocks/**`, and `src/vite-env.d.ts`. Minimum threshold flags are currently not enforced.

### 6) Evidence

- `.eslintrc.cjs`
- `.prettierrc`
- `tsconfig.app.json`
- `src/lib/devLog.ts`
- `src/App.tsx`
- `src/store/useInventoryStore.ts`
- `src/features/audio/useSound.ts`
- `tests/setup.ts`
