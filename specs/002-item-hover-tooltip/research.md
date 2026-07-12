# Research: Item Hover Tooltip Implementation

**Feature**: `002-item-hover-tooltip` | **Date**: 2026-07-12

This document provides implementation guidance for deciding how to build item hover tooltips during `speckit.plan`, with claims grounded in primary sources.

---

## R1. Accessibility baseline and behavior contract

- **Decision**: Treat tooltip behavior as an accessibility contract, not just a visual effect:
  - show on hover **and** keyboard focus,
  - dismiss on pointer/focus exit and `Escape`,
  - keep focus on trigger,
  - keep tooltip non-interactive.
- **Rationale**: WAI-ARIA APG tooltip guidance defines role/interaction expectations, and WCAG 2.1 SC 1.4.13 requires hover/focus content to be dismissible, hoverable, and persistent enough to read.  
  Sources: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/ , https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html
- **Implication for this spec**: FR-001/FR-003/FR-004 should be implemented with these keyboard and dismissal semantics so “hover tooltip” remains usable beyond mouse-only behavior.

## R2. Trigger model for desktop vs touch/coarse pointers

- **Decision**: Use hover-driven tooltip only on fine pointers that support hover; provide fallback interaction for coarse/non-hover inputs.
- **Rationale**: Media Queries Level 4 explicitly distinguishes `hover: hover|none` and pointer accuracy `pointer: fine|coarse|none`, which should drive input-adaptive behavior.
  Sources: https://www.w3.org/TR/mediaqueries-4/#hover , https://www.w3.org/TR/mediaqueries-4/#pointer
- **Recommended policy**:
  - `(hover: hover) and (pointer: fine)`: hover + focus tooltip.
  - otherwise: explicit tap/click info affordance (or inline details), not hover-only.

## R3. Option analysis: native `title` vs custom vs positioning library

### Option A — Native `title` attribute

- **Pros**: zero implementation cost.
- **Cons**: browser-controlled behavior and timing with limited author control, making WCAG hover-content expectations hard to satisfy consistently.
  Source: https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html
- **Use when**: extremely low-stakes hints where accessibility and precise behavior are not product requirements.

### Option B — Fully custom CSS/JS tooltip (no positioning engine)

- **Pros**: full control over triggers and rendering.
- **Cons**: collision-aware placement, viewport boundary handling, and lifecycle/perf become your responsibility.
- **Use when**: very simple static layouts where placement never needs smart flipping/shifting.

### Option C — Floating UI-backed custom component (**Recommended**)

- **Pros**:
  - robust placement via `computePosition()` with middleware such as `flip` and `shift`,
  - lifecycle-safe repositioning with `autoUpdate` and explicit cleanup guidance,
  - first-party tooltip interaction composition (`useHover`, `useFocus`, `useDismiss`, `useRole`) in their tooltip recipe.
  Sources: https://floating-ui.com/docs/computeposition , https://floating-ui.com/docs/autoupdate , https://floating-ui.com/docs/tooltip
- **Cons**: adds dependency and abstraction.
- **Use when**: product tooltip quality/consistency matters (this feature does).

## R4. Positioning, layering, and event-model pitfalls

- **Decision**: Render tooltip in a portal (e.g., `document.body`) and use collision-aware placement middleware.
- **Rationale**:
  - Portals help escape clipping/overflow contexts.
  - React portal caveat: events still bubble through the React tree (not physical DOM ancestry), which affects outside-click/hover logic.
  Source: https://react.dev/reference/react-dom/createPortal
- **Event model note**: React synthetic enter/leave semantics differ from native bubbling assumptions; design hover logic accordingly.
  Source: https://legacy.reactjs.org/docs/events.html

## R5. Performance constraints for dense item grids

- **Decision**: Mount and observe positioning only while tooltip is open; prefer single-active-tooltip state.
- **Rationale**: Floating UI documents that `autoUpdate` should only run while open, or performance can degrade significantly; updates are typically inexpensive when scoped correctly.
  Source: https://floating-ui.com/docs/autoupdate
- **Implementation implication**: aligns directly with FR-004 (one tooltip visible at a time) and P3 stability goals.

## R6. Testing strategy mapped to spec outcomes

- **Decision**: Test behavior by accessible role and user interactions:
  - hover/unhover,
  - keyboard focus,
  - Escape dismissal,
  - role-based queries for tooltip visibility/content.
- **Rationale**: Testing Library supports hover and role-oriented assertions that match user behavior and accessibility semantics.
  Sources: https://testing-library.com/docs/user-event/convenience/#hover , https://testing-library.com/docs/queries/byrole/

## R7. Popper vs Floating UI decision

- **Decision**: Prefer Floating UI for new implementation in this codebase.
- **Rationale**: Floating UI’s migration docs describe modernized API design and middleware model for new work; use Popper only if already entrenched in existing architecture.
  Source: https://floating-ui.com/docs/migration

---

## Recommendation matrix

| Criterion | Native `title` | Custom CSS/JS | Floating UI + custom component |
|---|---|---|---|
| Accessibility control | Low | Medium/High (manual) | High (with documented tooltip recipe) |
| Trigger flexibility (hover/focus/escape) | Low | High | High |
| Viewport collision handling | Low | Low/Medium (manual) | High (`flip`/`shift`) |
| Performance safety at scale | High (trivial) | Medium (manual discipline) | High (with `autoUpdate` lifecycle discipline) |
| Implementation effort | Very low | Medium/High | Medium |
| Long-term maintainability | Low/Medium | Medium | High |

## Recommended implementation approach for `speckit.plan`

1. Build shared `ItemTooltip` wrapper on Floating UI.
2. Wire triggers: hover + focus; dismiss on leave/blur/Escape.
3. Apply `role="tooltip"` + `aria-describedby`; keep content non-interactive.
4. Portal render to `document.body`; use `offset + flip + shift`.
5. Enable only one open tooltip at a time.
6. Gate hover behavior by input capability media queries; add touch fallback affordance.
7. Add tests for SC-001..SC-003 (latency threshold checks, visibility, viewport fit) and rapid item transitions.

## Phased implementation plan (planning-ready)

- **Phase 1 (MVP)**: accessible hover/focus tooltip for one item at a time.
- **Phase 2**: viewport-safe placement + portal layering.
- **Phase 3**: dense-grid stability/perf hardening (delays, cleanup guarantees).
- **Phase 4**: regression and accessibility test coverage.

---

## Pitfall checklist

- Do not implement hover-only behavior without keyboard/focus parity.  
  Source: https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html
- Do not place interactive controls inside tooltip content.  
  Source: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
- Do not keep positioning observers active while tooltip is closed.  
  Source: https://floating-ui.com/docs/autoupdate
- Do not assume portal DOM position changes React event bubbling semantics.  
  Source: https://react.dev/reference/react-dom/createPortal
