# Standard Feature Development Workflow Rule

> [!IMPORTANT]
> **AUTOMATED WORKFLOW DIRECTIVE**: This 5-phase workflow MUST be automatically executed for EVERY feature request, bug fix, or code modification in this workspace. You do NOT need to ask the user to activate it—it is mandatory for all changes. Never skip Phase 1 (Grilling), Phase 2 (Local App Review & Iteration), Phase 3 (Feature Branch & Staging), Phase 4 (Parallel Sub-Agents in Worktrees), or Phase 5 (Review, Merge to Main & Cleanup).

## Workflow Phases & Rules

### Phase 1: Core Feature Implementation

- **Alignment & Planning (Mandatory Grilling)**: ALWAYS automatically grill the user (via interactive questions or `/grill-me` interview) before creating an implementation plan to confirm alignment on design decisions, clarify underspecified requirements, explore edge cases, and ensure full alignment on the plan. Once user accepts implementation plan then move onto Scope Focus.
- **Scope Focus**: Implement core logic, application architecture, state management, and foundational HTML markup directly within the current workspace context.
- **Constraints**:
  - Do NOT write unit tests during initial coding.
  - Do NOT optimize pixel-perfect styling or deep Tailwind responsiveness tweaks.
  - Do NOT conduct accessibility audits or ARIA fine-tuning during this phase.

---

### Phase 2: Local App Review & Iteration Loop

- **Local Preview**: Launch local dev server (`npm run dev`) and open a browser using /browser that points to the local dev server.
- **Manual Verifican**: Display a list of functionality changes for user to verify manually.
- **Interactive Iteration Loop**: Keep the dev server active and perform any requested adjustments to logic/markup iteratively until satisfied.
- **Explicit Approval Gate**: Prompt the user via the `ask_question` interactive tool to explicitly approve advancing to Phase 3:
  - _Proceed to Phase 3_ (Staging, Feature Branch & Sub-agents).
  - _Make further core changes_.

---

### Phase 3: Handoff Action (Feature Branch Setup & Staging)

_Executes ONLY after explicit user confirmation in Phase 2._

- **Git Operations**:
  - Stage changes: `git add .`
  - Commit to new feature branch: `git checkout -b feature/<feature-name>` & `git commit -m "feat: core implementation"`
  - Push to remote: `git push -u origin feature/<feature-name>`
  - **No PR Creation**: Do NOT create a GitHub pull request (`gh pr create`). All review and merging will happen directly and locally into `main` after Phase 4 sub-agent checks and Phase 5 review.

---

### Phase 4: Parallel Sub-Agent Execution in Isolated Git Worktrees

- Create 3 isolated Git worktrees off the feature branch:
  - `.worktrees/test`
  - `.worktrees/a11y`
  - `.worktrees/styling`
- Initiate 3 concurrent sub-agents:
  1. **Test Agent** (`.worktrees/test`): Writes unit tests (Vitest). Verifies tests pass (`npm run test`), strict type-checking passes (`npx tsc --noEmit`), and code style passes (`npm run lint`).
  2. **Accessibility Agent** (`.worktrees/a11y`): Audits modified files for WCAG compliance and outputs `report.md`. Verifies `npm run lint` on report/changes.
  3. **Styling Agent** (`.worktrees/styling`): Audits Tailwind CSS classes and optimizes layout responsiveness. Verifies `npm run build` and `npm run lint` on modified files.
  4. **AUTOMATICALLY BEGIN PHASE 5**: If no warnings or errors are found after each sub-agents completes it's audit. Move onto phase 5 without prompting user.
- **Sub-Agent Commit Invariant**: Every sub-agent MUST run `npx tsc --noEmit` and `npm run lint` in its worktree and resolve all warnings/errors before committing its worktree branch.

---

### Phase 5: Local Review, Sign-Off, Direct Merge to Main & Cleanup

- **Merge Updates**: Commit and merge each sub-agent worktree branch back into `feature/<feature-name>`.
- **Review Prompt, Code Review & Local Dev Server**:
  - Ensure local dev server is running (`npm run dev`) and connect to previously launched browser instance. If no /browser instance exist then create a new one and point to the local dev server so the user can inspect the application.
  - Present the code diff (`git diff main...feature/<feature-name>`) and summary of changes for user code review.
  - Provide direct links to sub-agent reports (e.g. accessibility `report.md`, test summaries, styling changes).
  - Prompt the user to:
    1. Take a look at the app in the browser.
    2. Perform a code review of the merged changes.
    3. Perform their final check.
- **Final Sign-Off Approval Gate**: Prompt the user via the `ask_question` interactive tool to sign off on merging into `main`:
  - _Sign off & merge into main_ (Run build check, merge `feature/<feature-name>` into `main`, and push).
  - _Request further adjustments_ (Keep worktrees intact for additional updates).
- **Production Build Verification**:
  - Run production build command (`npm run build`).
  - If build succeeds without errors, proceed to merge into `main`.
  - If build fails or produces errors, HALT execution immediately and report errors for triage before touching branches or worktrees.
- **Direct Merge into Main**:
  - Switch to main branch: `git checkout main` (or if `main` is active in the primary repo worktree, execute the merge in that worktree with `git -C <main-worktree> merge feature/<feature-name>`).
  - Ensure main is up to date: `git pull origin main`
  - Merge the feature branch: `git merge feature/<feature-name>`
  - Push updated main to remote: `git push origin main`
- **Worktree Pruning & Cleanup**:
  - Remove and prune Git worktrees (`git worktree remove .worktrees/test`, `git worktree remove .worktrees/a11y`, `git worktree remove .worktrees/styling` and `git worktree prune`).
  - Delete the feature branch locally (`git branch -d feature/<feature-name>`) and on remote (`git push origin --delete feature/<feature-name>`).
- **Close Dev Server**:
  - Close any dev servers that were launched
