# Standard Feature Development Workflow Rule

> [!IMPORTANT]
> **AUTOMATED WORKFLOW DIRECTIVE**: This 5-phase workflow MUST be automatically executed for EVERY feature request, bug fix, or code modification in this workspace. You do NOT need to ask the user to activate it—it is mandatory for all changes. Never skip Phase 1 (Grilling), Phase 2 (Local App Review & Iteration), Phase 3 (Branch & Draft PR), Phase 4 (Parallel Sub-Agents in Worktrees), or Phase 5 (Cleanup).

## Workflow Phases & Rules

### Phase 1: Core Feature Implementation

- **Alignment & Planning (Mandatory Grilling)**: ALWAYS automatically grill the user (via interactive questions or `/grill-me` interview) before beginning feature implementation to resolve design decisions, clarify underspecified requirements, explore edge cases, and ensure full alignment on the plan.
- **Scope Focus**: Implement core logic, application architecture, state management, and foundational HTML markup directly within the current workspace context.
- **Constraints**:
  - Do NOT write unit tests during initial coding.
  - Do NOT optimize pixel-perfect styling or deep Tailwind responsiveness tweaks.
  - Do NOT conduct accessibility audits or ARIA fine-tuning during this phase.

---

### Phase 2: Local App Review & Iteration Loop

- **Local Preview**: Launch local dev server (`npm run dev`) and open local preview browser URL.
- **Interactive Iteration Loop**: Keep the dev server active and perform any requested adjustments to logic/markup iteratively until satisfied.
- **Explicit Approval Gate**: Prompt the user via the `ask_question` interactive tool to explicitly approve advancing to Phase 3:
  - _Proceed to Phase 3_ (Staging, Draft PR, Sub-agents).
  - _Make further core changes_.

---

### Phase 3: Handoff Action (Commit & Draft PR)

_Executes ONLY after explicit user confirmation in Phase 2._

- **Git Operations**:
  - Stage changes: `git add .`
  - Commit to new feature branch: `git checkout -b feature/<feature-name>` & `git commit -m "feat: core implementation"`
  - Push to remote: `git push -u origin feature/<feature-name>`
  - Create Draft Pull Request via GitHub CLI: `gh pr create --draft --title "..." --body "..."`

---

### Phase 4: Parallel Sub-Agent Execution in Isolated Git Worktrees

- Create 3 isolated Git worktrees off the feature branch:
  - `.worktrees/test`
  - `.worktrees/a11y`
  - `.worktrees/styling`
- Initiate 3 concurrent sub-agents:
  1. **Test Agent** (`.worktrees/test`): Writes unit tests (Vitest). Verifies tests pass.
  2. **Accessibility Agent** (`.worktrees/a11y`): Audits modified files for WCAG compliance and outputs `report.md`.
  3. **Styling Agent** (`.worktrees/styling`): Audits Tailwind CSS classes and optimizes layout responsiveness.

---

### Phase 5: Push Updates, Final Verification & Cleanup

- Commit and push each sub-agent worktree branch to remote and merge back into `feature/<feature-name>`.
- Refresh/verify local preview with user.
- Remove and prune Git worktrees (`git worktree remove .worktrees/...` and `git worktree prune`).
