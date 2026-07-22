# Repository Guidelines & Instructions

## Feature Development Workflow

Whenever making changes to this codebase (features, UI enhancements, refactoring, or bug fixes), **ALWAYS** strictly follow the 5-phase workflow defined in [.gemini/rules/feature-workflow.md](file:///.gemini/rules/feature-workflow.md):

1. **Phase 1: Core Feature Implementation**
   - Automatically grill the user before coding (via interactive questions).
   - Implement core logic and markup in the workspace (no unit tests or deep styling yet).
2. **Phase 2: Local App Review & Iteration Loop**
   - Run `npm run dev` and review locally.
   - Prompt user via `ask_question` gate to approve advancing to Phase 3.
3. **Phase 3: Handoff Action (Commit & Draft PR)**
   - Create feature branch, commit, push, and open Draft PR (`gh pr create --draft`). Use `GH_TOKEN` from git credentials if `gh` CLI auth is needed.
4. **Phase 4: Parallel Sub-Agent Execution in Isolated Git Worktrees**
   - Create worktrees (`.worktrees/test`, `.worktrees/a11y`, `.worktrees/styling`).
   - Spawn sub-agents concurrently to write unit tests, perform WCAG audit, and optimize Tailwind CSS.
5. **Phase 5: Merge, Review Gate, Build & PR Readiness**
   - Merge sub-agent branches into feature branch and present reports.
   - Prompt user via `ask_question` gate to review reports and test app before proceeding.
   - Run `npm run build`; if errors occur, HALT for triage before cleanup.
   - Push final merged branch, remove and prune Git worktrees.
   - Mark PR as ready for review (`gh pr ready <pr-number>`).
   - Provide the Netlify Deploy Preview link (`https://deploy-preview-<pr-number>--<site-name>.netlify.app`). Production GitHub Pages (`main`) must NEVER be used for PR feature previews; do not run local preview servers after PR submission.

