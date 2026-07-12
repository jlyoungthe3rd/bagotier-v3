<!--
Sync Impact Report
==================
Version change: (template) → 1.0.0
Modified principles: N/A (initial ratification)
Added sections:
  - Core Principles (I. Code Quality, II. Testing Standards, III. User Experience
    Consistency, IV. Performance Requirements)
  - Quality Gates & Development Workflow
  - Governance
Removed sections: N/A
Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check gates align; no edits needed —
    gates are derived from this file at plan time)
  - ✅ .specify/templates/spec-template.md (no constitution-specific references; compatible)
  - ✅ .specify/templates/tasks-template.md (task categories accommodate test-first and
    performance tasks; compatible)
Follow-up TODOs: none
-->

# BagotierV3 Constitution

## Core Principles

### I. Code Quality

All code merged into the main branch MUST be clear, maintainable, and reviewed.

- Every change MUST pass peer review (or explicit self-review checklist for solo work)
  before merge; no direct commits to the main branch.
- Code MUST pass the project's configured linter and formatter with zero errors; warnings
  MUST be resolved or explicitly suppressed with a justifying comment.
- Functions and modules MUST have a single, clear responsibility; cyclomatic complexity
  beyond the linter's threshold MUST be refactored or justified in review.
- Public APIs, exported functions, and non-obvious logic MUST be documented at the point
  of definition; stale comments MUST be removed when behavior changes.
- Dead code, commented-out blocks, and unused dependencies MUST NOT be merged.

**Rationale**: Consistent, reviewed, well-factored code keeps the cost of change low and
makes defects visible early, when they are cheapest to fix.

### II. Testing Standards (NON-NEGOTIABLE)

Tests are written before or alongside implementation and are a merge gate, not an
afterthought.

- Every new feature or bug fix MUST include automated tests that fail without the change
  and pass with it (red-green-refactor for new behavior; regression test for every bug).
- Unit tests MUST cover core business logic; integration tests MUST cover contract
  boundaries (APIs, persistence, inter-service communication, shared schemas).
- The full test suite MUST pass in CI before merge; flaky tests MUST be fixed or
  quarantined with a tracking issue within one working day of detection.
- Test code is held to the same quality bar as production code: readable, isolated,
  deterministic, and fast enough to run on every commit.
- Coverage MUST NOT decrease on the changed code paths of a pull request.

**Rationale**: A trustworthy, always-green test suite is the only mechanism that allows
confident refactoring and rapid iteration without regressions.

### III. User Experience Consistency

Users MUST experience the product as one coherent system, regardless of which feature or
surface they touch.

- All user-facing surfaces MUST follow a single shared design system: common components,
  spacing, typography, color tokens, and interaction patterns. New patterns MUST be added
  to the design system before use, not invented per-feature.
- Terminology, labels, and messaging MUST be consistent across the product; the same
  concept MUST NOT have different names in different screens or messages.
- Error states, empty states, and loading states MUST be designed and implemented for
  every user-facing flow — never blank screens or raw error dumps.
- Accessibility is mandatory: interactive elements MUST be keyboard-operable, have
  accessible names, and meet WCAG 2.1 AA contrast requirements.
- Breaking changes to user-visible behavior MUST be flagged in review and accompanied by
  a migration or communication plan.

**Rationale**: Consistency reduces users' cognitive load, builds trust, and lowers
support and onboarding costs; ad-hoc UX decisions compound into an incoherent product.

### IV. Performance Requirements

Performance is a feature with explicit budgets, measured before merge — not tuned after
complaints.

- Every feature specification MUST declare its performance budget (e.g., p95 API latency
  ≤ 200 ms, interactive UI response ≤ 100 ms, initial page load ≤ 3 s on a mid-tier
  device); features without a stated budget inherit these defaults.
- Changes that plausibly affect hot paths MUST include measurement (benchmark, profile,
  or load test result) in the pull request before merge.
- Regressions beyond 10% on an established budget MUST block merge until fixed or the
  budget is formally amended with justification.
- Resource usage (memory, bundle size, database query counts) MUST be bounded; N+1
  queries and unbounded result sets MUST be caught in review.
- Production performance MUST be observable: key flows emit latency and error metrics
  with structured logging sufficient to diagnose regressions.

**Rationale**: Performance debt is invisible until it is expensive; explicit budgets and
pre-merge measurement keep it visible and cheap to correct.

## Quality Gates & Development Workflow

- **Plan gate**: Every implementation plan MUST pass the Constitution Check in
  `plan-template.md` against these principles before design work proceeds; violations
  MUST be recorded and justified in the plan's Complexity Tracking section.
- **Merge gate**: A pull request is mergeable only when (1) review is approved,
  (2) lint/format checks pass, (3) the full test suite is green, and (4) any declared
  performance budgets are demonstrated to hold.
- **Simplicity default**: Start with the simplest design that satisfies the spec (YAGNI);
  added complexity (new dependencies, layers, or services) MUST be justified in review.
- **Traceability**: Each merged change MUST link to its spec or issue so requirements,
  tests, and code remain connected.

## Governance

- This constitution supersedes all other development practices for this project. Where a
  guideline elsewhere conflicts with this document, this document wins.
- **Amendments**: Any contributor may propose an amendment via pull request modifying
  this file. The PR MUST include the rationale, the semantic version bump, and updates to
  any dependent templates (`plan-template.md`, `spec-template.md`, `tasks-template.md`)
  affected by the change. Approval by a project maintainer is required.
- **Versioning policy**: MAJOR for removals or incompatible redefinitions of principles;
  MINOR for new principles or materially expanded guidance; PATCH for clarifications and
  wording fixes.
- **Compliance review**: All PRs and reviews MUST verify compliance with the Core
  Principles; the plan-phase Constitution Check re-verifies after design. Unjustified
  violations block merge.

**Version**: 1.0.0 | **Ratified**: 2026-07-11 | **Last Amended**: 2026-07-11
