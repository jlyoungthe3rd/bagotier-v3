# Codebase Concerns

## Core Sections (Required)

### 1) Top Risks (Prioritized)

| Severity | Concern                                    | Evidence                                                                                | Impact                                                                                               | Suggested action                                                                                    |
| -------- | ------------------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Low      | Unwrapped `act(...)` Warnings in RTL Tests | `npm test` outputs occasional React 19 `act(...)` console warnings during async queries | Clutters test output logs; potential indicator of asynchronous timing drift in tests                 | Wrap remaining asynchronous query updates and event triggers in `await act(...)` or `userEvent`.    |
| Low      | Incomplete Keyboard Nav Unit Coverage      | `src/features/inventory/keyboard.ts` line coverage is at 25%                            | Direct unit testing for directional slot arrow transitions is deferred while design decisions evolve | Expand unit tests in `tests/unit/keyboard-nav.test.ts` once keyboard navigation behavior finalized. |

### 2) Technical Debt

| Debt item                          | Why it exists                                                                  | Where                                  | Risk if ignored                                                          | Suggested fix                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Future Rename for `dnd-test-utils` | File name retains historical `dnd-` prefix although now testing general layout | `tests/integration/dnd-test-utils.tsx` | Minor cosmetic naming inconsistency; no functional risk (all tests pass) | Rename to `test-utils.tsx` or `layout-test-utils.tsx` during future test refactoring cycle. |

### 3) Security Concerns

| Risk                                      | OWASP category (if applicable)     | Evidence                                                 | Current mitigation                                          | Gap                                                                                               |
| ----------------------------------------- | ---------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Reverse Tabnabbing via External Anchor    | N/A (Client Security)              | `src/features/github/GitHubLink.tsx` (`target="_blank"`) | Modern evergreen browsers imply `rel="noopener"` by default | Explicit `rel="noopener noreferrer"` attribute is omitted on the anchor tag.                      |
| Missing Production CSP / Security Headers | A05:2021 Security Misconfiguration | `index.html`, `netlify.toml`, `vercel.json`              | Static client-only bundle; no sensitive credentials handled | No Content Security Policy (CSP) meta tag or HTTP security headers defined in deployment configs. |

### 4) Performance and Scaling Concerns

| Concern                                    | Evidence                                                                                        | Current symptom                                                                      | Scaling risk                                                                | Suggested improvement                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Viewport Layout Clamping on Mobile Resizes | `src/features/character/FanOut.tsx` runs `useLayoutEffect` to clamp fanned item X offsets       | Minimal; throttled by browser layout cycle                                           | Rapid resizing or heavy orientation change could trigger multiple relayouts | Debounce resize listener or precalculate boundary positions.                 |
| Just-in-Time Audio Buffer Preloading       | `src/features/audio/useSound.ts` initializes audio preloading on first user interaction or load | First played sound effect can experience subtle latency if assets are not pre-cached | Degraded sound tactile feedback on slower mobile connections                | Preload sound assets during initial app idle time via `requestIdleCallback`. |

### 5) Fragile/High-Churn Areas

| Area                                                         | Why fragile                                                                                           | Churn signal                                      | Safe change strategy                                                                                  |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/features/character/FanOut.tsx`                          | Complex radial-to-horizontal animation, focus trapping, roving tabindex, and viewport bounds clamping | 12 commits in last 90 days (`.codebase-scan.txt`) | Run `npm test` and verify all 34 fan-out unit tests and a11y tests pass before modifying animation.   |
| `src/features/character/EquipmentSlot.tsx`                   | Coordinates hover delay timers, leave grace periods, and equipped vs empty slot states                | 10 commits in last 90 days (`.codebase-scan.txt`) | Verify focus restoration to slot triggers and test with `tests/unit/equipment-slot.test.tsx`.         |
| `src/features/character/CharacterView.tsx` & `StatPanel.tsx` | Highly active visual centerpiece with responsive paper doll columns and attribute animations          | 10 commits in last 90 days (`.codebase-scan.txt`) | Ensure RTL tests in `character-view.test.tsx` and `stat-panel.test.tsx` pass after any layout change. |
| `AGENTS.md`                                                  | Workspace directive governing multi-phase autonomous agent feature development                        | 9 commits in last 90 days (`.codebase-scan.txt`)  | Review workflow phases and automated worktree gates before initiating new feature branches.           |

### 6) `[ASK USER]` Questions & Resolutions

1. **[RESOLVED] Drag-and-Drop / `dnd-kit` References**:
   - _User Decision_: Retired `@dnd-kit/core` completely.
   - _Action_: `README.md` and `tests/integration/dnd-test-utils.tsx` updated to reflect the Destiny 2 horizontal fan-out interaction model and remove all `@dnd-kit` references.
2. **[RESOLVED] Equipment Slot Inspector Pattern (Destiny 2 Style)**:
   - _User Decision_: Implemented, verified, and merged (`FanOut.tsx`).
   - _Action_: Marked Step 2 as completed `[x]` in `docs/feature_todos.md`.
3. **[RESOLVED] Keyboard Navigation Coverage Decision**:
   - _User Decision_: Deferred adding extra unit tests for keyboard navigation at this time, as keyboard design decisions are ongoing.
4. **[RESOLVED] Prettier Code Formatting**:
   - _Result_: Fully compliant; `npm run lint` passes cleanly with zero warnings/errors.
5. **[RESOLVED] Vitest Coverage Tooling (`@vitest/coverage-v8`)**:
   - _Result_: Configured and operational (`npm run test:coverage`), achieving 89.15% statement and 89.07% line coverage across the project.

### 7) Evidence

- `docs/codebase/.codebase-scan.txt`
- `README.md`
- `tests/integration/dnd-test-utils.tsx`
- `src/features/character/CharacterView.tsx`
- `src/features/inventory/keyboard.ts`
- `docs/feature_todos.md`
- Terminal output from `npm test` and `npm run lint`
