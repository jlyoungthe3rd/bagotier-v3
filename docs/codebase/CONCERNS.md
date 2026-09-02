# Codebase Concerns

## Core Sections (Required)

### 1) Top Risks (Prioritized)

| Severity | Concern                                       | Evidence                                                                                | Impact                                                                                       | Suggested action                                                                        |
| -------- | --------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Med      | Outdated Documentation on Drag-and-Drop       | `README.md` lines 22, 37, 75 cite `@dnd-kit/core`, but package is not in `package.json` | Causes significant developer confusion and architectural dissonance for onboarding engineers | Update `README.md` and test comments to accurately document click/keyboard interaction. |
| Med      | Prettier Check Failures Breaking Lint Command | `npm run lint` fails with exit code 1; 5 files flagged by `prettier --check .`          | Blocks CI pipelines or pre-commit hooks that enforce `npm run lint`                          | Run `npm run format` to bring all tracked files into compliance with `.prettierrc`.     |
| Low      | Unwrapped `act(...)` Warnings in RTL Tests    | `npm test` outputs multiple React 19 `act(...)` console warnings during component tests | Clutters test output logs; potential indicator of asynchronous timing drift in tests         | Wrap asynchronous query updates and event triggers in `await act(...)` or `userEvent`.  |

### 2) Technical Debt

| Debt item                               | Why it exists                                                                                       | Where                                                   | Risk if ignored                                                                                    | Suggested fix                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Residual DnD Test Utility Comments      | DnD kit was previously used and removed in favor of click/keyboard controls                         | `tests/integration/dnd-test-utils.tsx`                  | New contributors may assume dnd-kit is installed or try to restore broken sensor code              | Refactor file to `test-utils.tsx` and clarify jsdom layout mock purpose. |
| Hardcoded Responsive Breakpoint Mapping | Keyboard grid navigation relies on hardcoded window media queries to compute grid columns (4, 6, 8) | `src/features/inventory/keyboard.ts` (`getGridColumns`) | If Tailwind CSS grid column breakpoints change in `InventoryGrid.tsx`, arrow keys will misnavigate | Centralize grid column breakpoints into a shared config constant.        |
| Absence of Test Coverage Tooling        | No coverage reporter configured in devDependencies or Vitest config                                 | `package.json`, `vitest.config.ts`                      | Code regressions and untested edge cases may accumulate unnoticed                                  | Install `@vitest/coverage-v8` and define minimum coverage thresholds.    |

### 3) Security Concerns

| Risk                                      | OWASP category (if applicable)     | Evidence                                                 | Current mitigation                                          | Gap                                                                                               |
| ----------------------------------------- | ---------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Reverse Tabnabbing via External Anchor    | N/A (Client Security)              | `src/features/github/GitHubLink.tsx` (`target="_blank"`) | Modern evergreen browsers imply `rel="noopener"` by default | Explicit `rel="noopener noreferrer"` attribute is omitted on the anchor tag.                      |
| Missing Production CSP / Security Headers | A05:2021 Security Misconfiguration | `index.html`, `netlify.toml`, `vercel.json`              | Static client-only bundle; no sensitive credentials handled | No Content Security Policy (CSP) meta tag or HTTP security headers defined in deployment configs. |

### 4) Performance and Scaling Concerns

| Concern                              | Evidence                                                                                | Current symptom                                                                      | Scaling risk                                                                         | Suggested improvement                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Broad Grid Component Re-Renders      | `src/features/inventory/InventoryGrid.tsx` subscribes to the full `bag` array           | Entire 24-cell grid re-renders on every single item equip or swap                    | Negligible for 24 cells, but causes UI frame drops if inventory scales to 100+ cells | Pass individual slot selectors to memoized `BagCell` components.             |
| Just-in-Time Audio Buffer Preloading | `src/features/audio/useSound.ts` initializes audio preloading on first user interaction | First played sound effect can experience subtle latency if assets are not pre-cached | Degraded sound tactile feedback on slower mobile connections                         | Preload sound assets during initial app idle time via `requestIdleCallback`. |

### 5) Fragile/High-Churn Areas

| Area                                                         | Why fragile                                                                                        | Churn signal                                       | Safe change strategy                                                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/App.tsx`                                                | Central wiring root coordinating React Query, store seeding, layout skeleton, and error boundaries | 7 commits in last 90 days (`.codebase-scan.txt`)   | Keep component minimal and declarative; delegate layout and domain logic to features.                 |
| `src/features/character/CharacterView.tsx` & `StatPanel.tsx` | Highly active visual centerpiece undergoing UI redesigns (paper doll layout, attribute animations) | 6-7 commits in last 90 days (`.codebase-scan.txt`) | Ensure RTL tests in `character-view.test.tsx` and `stat-panel.test.tsx` pass after any layout change. |
| `AGENTS.md`                                                  | Workspace directive governing multi-phase autonomous agent feature development                     | 8 commits in last 90 days (`.codebase-scan.txt`)   | Review workflow phases and automated worktree gates before initiating new feature branches.           |

### 6) `[ASK USER]` Questions & Resolutions

1. **[RESOLVED] Drag-and-Drop / `dnd-kit` References**:
   - _User Decision_: Remove all references to `dnd-kit`. Drag-and-drop is no longer planned; the inventory operates exclusively via a "click-and-select" flow.
   - _Action_: Update `README.md` and refactor `tests/integration/dnd-test-utils.tsx` to clean out legacy sensor comments and naming.
2. **[RESOLVED] Equipment Slot Inspector Pattern (Destiny 2 Style)**:
   - _User Decision_: Confirmed and committed to going forward. When a user focuses, clicks, or hovers an equipment slot on the character, an inspector/flyout displays only the compatible, equipable items for user selection.
   - _Action_: Feature planned as Step 2 in `docs/feature_todos.md`.
3. **[RESOLVED] Prettier Code Formatting**:
   - _User Decision_: Executed `npm run format`.
   - _Result_: All files now comply with `.prettierrc`; `npm run lint` passes cleanly with zero warnings/errors.
4. **[RESOLVED] Vitest Coverage Tooling (`@vitest/coverage-v8`)**:
   - _Status_: Detailed explanation provided to the user on benefits vs. overhead before enabling.

### 7) Evidence

- `docs/codebase/.codebase-scan.txt`
- `README.md`
- `tests/integration/dnd-test-utils.tsx`
- `src/features/character/CharacterView.tsx`
- `src/features/inventory/keyboard.ts`
- `docs/feature_todos.md`
- Terminal output from `npm test` and `npm run lint`
