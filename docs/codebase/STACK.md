# Technology Stack

## Core Sections (Required)

### 1) Runtime Summary

| Area                | Value                                                              | Evidence                                                  |
| ------------------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| Primary language    | TypeScript 5.9.3 (strict mode, `noUncheckedIndexedAccess`)         | `package.json`, `tsconfig.app.json`                       |
| Runtime + version   | Browser (ES2022 / modern evergreen browsers); Node.js 20 in CI     | `tsconfig.app.json`, `.github/workflows/deploy-pages.yml` |
| Package manager     | npm (lockfile v3)                                                  | `package-lock.json`, `package.json`                       |
| Module/build system | Vite 8.1.4 (ESNext / native ESM) with `@vitejs/plugin-react` 6.0.3 | `package.json`, `vite.config.ts`                          |

### 2) Production Frameworks and Dependencies

| Dependency              | Version  | Role in system                                                                           | Evidence                                                                                           |
| ----------------------- | -------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `react`                 | ^19.2.7  | Core UI library for component trees, hooks, and suspense                                 | `package.json`, `src/App.tsx`                                                                      |
| `react-dom`             | ^19.2.7  | DOM renderer for React web application                                                   | `package.json`, `src/main.tsx`                                                                     |
| `zustand`               | ^5.0.14  | Client session and UI state management (equipped item IDs, bag slots, audio mute, focus) | `package.json`, `src/store/useInventoryStore.ts`                                                   |
| `@tanstack/react-query` | ^5.101.2 | Data caching layer for character details and item catalog                                | `package.json`, `src/lib/queryClient.ts`, `src/features/inventory/useInventoryQuery.ts`            |
| `framer-motion`         | ^12.42.2 | Micro-interactions: item slot popLayout animations and stat counter highlights           | `package.json`, `src/features/character/EquipmentSlot.tsx`, `src/features/character/StatPanel.tsx` |
| `@floating-ui/react`    | ^0.27.20 | Viewport-aware tooltip anchoring, autoUpdate, flip, shift, and portal rendering          | `package.json`, `src/features/inventory/tooltip/ItemTooltipPresenter.tsx`                          |
| `zod`                   | ^4.4.3   | Runtime schema validation and boundary contract enforcement                              | `package.json`, `src/types/schemas.ts`                                                             |

> [!NOTE]
> `README.md` previously cited `@dnd-kit/core` as a dependency; however, `@dnd-kit/core` is not present in `package.json`. The application currently implements click and keyboard-based equip/unequip interactions.

### 3) Development Toolchain

| Tool                                           | Purpose                                                             | Evidence                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `vite` (v8.1.4)                                | Local development server (`HMR`) and production asset bundler       | `package.json`, `vite.config.ts`                                 |
| `vitest` (v4.1.10)                             | Unit and integration test runner with jsdom environment             | `package.json`, `vitest.config.ts`                               |
| `@testing-library/react` (v16.3.2)             | Component rendering and user interaction simulation in tests        | `package.json`, `tests/integration/character-view.test.tsx`      |
| `@testing-library/user-event` (v14.6.1)        | Realistic keyboard and pointer event simulation                     | `package.json`, `tests/integration/keyboard-navigation.test.tsx` |
| `@testing-library/jest-dom` (v6.9.1)           | Custom DOM element matchers (`toBeInTheDocument`, etc.)             | `package.json`, `tests/setup.ts`                                 |
| `jsdom` (v29.1.1)                              | Headless browser environment for Vitest                             | `package.json`, `vitest.config.ts`                               |
| `typescript` (v5.9.3)                          | Static typing compiler (`tsc -b`) with strict checking              | `package.json`, `tsconfig.app.json`                              |
| `eslint` (v8.57.1)                             | Linting with `@typescript-eslint/strict-type-checked`               | `package.json`, `.eslintrc.cjs`                                  |
| `prettier` (v3.9.5)                            | Code formatting validation and styling enforcement                  | `package.json`, `.prettierrc`                                    |
| `tailwindcss` (v3.4.19)                        | Utility-first CSS generation with custom dark/fantasy design tokens | `package.json`, `tailwind.config.ts`, `src/index.css`            |
| `postcss` (v8.5.17) / `autoprefixer` (v10.5.2) | CSS post-processing pipeline                                        | `package.json`, `postcss.config.js`                              |

### 4) Key Commands

```bash
npm install        # Install project dependencies using lockfile
npm run dev        # Start Vite development server at http://localhost:5173
npm run build      # Compile TypeScript (tsc -b) and bundle client assets via Vite
npm run preview    # Preview locally built dist bundle
npm test           # Execute Vitest test suite in run mode
npm run test:watch # Run Vitest in interactive watch mode
npm run lint       # Run ESLint (zero warnings allowed) and Prettier check
npm run format     # Format code across project with Prettier
```

### 5) Environment and Config

- Config sources:
  - `vite.config.ts`
  - `vitest.config.ts`
  - `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
  - `tailwind.config.ts`, `postcss.config.js`
  - `.eslintrc.cjs`, `.prettierrc`
  - `netlify.toml`, `vercel.json`, `.github/workflows/deploy-pages.yml`
- Required env vars:
  - `VITE_BASE`: Optional build-time base path override. Used in GitHub Actions (`VITE_BASE="/${REPO_NAME}/"`), Netlify (`VITE_BASE=/bagotier-v3/`), and local previews. Defaults to `'/'` in `vite.config.ts`.
  - No secret keys or credentials required (100% client-side application).
- Deployment/runtime constraints:
  - Static SPA; runs entirely in client browser context.
  - Requires Web Audio API support (`AudioContext`) for audio sound effects; degrades gracefully to silent operation if unsupported or autoplay restricted.

### 6) Evidence

- `package.json`
- `package-lock.json`
- `tsconfig.app.json`
- `vite.config.ts`
- `vitest.config.ts`
- `.eslintrc.cjs`
- `.github/workflows/deploy-pages.yml`
- `netlify.toml`
- `src/features/audio/useSound.ts`
