# Research: Game Inventory Management Experience

**Feature**: `001-game-inventory-system` | **Date**: 2026-07-11

The user supplied a complete technical context, so no NEEDS CLARIFICATION items remained
in the Technical Context. Research below consolidates the decisions, their rationale, and
the alternatives considered, plus best-practice findings for each mandated technology and
the two open implementation questions (audio strategy, drag-and-drop architecture).

---

## R1. Build tooling — Vite + strict TypeScript

- **Decision**: Vite 5 with the `react-ts` template; `tsconfig` with `"strict": true`,
  `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, and `verbatimModuleSyntax`.
- **Rationale**: User-mandated. Vite gives sub-second HMR for interaction-heavy UI work
  and produces a small, tree-shaken production bundle (supports the ≤250 KB gz budget).
  `noUncheckedIndexedAccess` is specifically valuable here: inventory cells and equipment
  slots are indexed lookups that may legitimately be empty.
- **Alternatives considered**: Next.js (rejected — SSR/routing unneeded for a single
  screen with no backend; larger footprint); CRA (deprecated, slow); plain esbuild
  (rejected — loses Vite's dev-server DX and Tailwind/PostCSS integration convenience).

## R2. State management — Zustand referencing React Query (never copying)

- **Decision**: Two-store discipline. React Query owns *server-shaped* data (item catalog,
  character base data) even though it is mocked. Zustand owns only *session/UI* state:
  `equippedItemIds: Record<SlotType, ItemId | null>`, `bagItemIds: (ItemId | null)[]`,
  `muted: boolean`, `activeDragItemId: ItemId | null`. Components resolve IDs to full
  `Item` objects via a `useItem(id)` selector hook that reads the React Query cache
  (`queryClient.getQueryData` / `useQuery` with `select`). Zustand never stores an `Item`
  object.
- **Rationale**: User-mandated constraint ("Zustand will only reference data from React
  Query and will never copy it directly"). This normalization gives a single source of
  truth: if item data ever changed (refetch, future backend), no stale copies exist.
  It also satisfies FR-011 (exactly-once modifier application) structurally — an item ID
  can appear in at most one place, so effective stats derived from IDs cannot
  double-count.
- **Best practices adopted**: atomic Zustand selectors (`useInventoryStore(s => s.muted)`)
  to avoid over-rendering during drags; all mutations expressed as named store actions
  (`equip`, `unequip`, `swap`, `cancelDrag`) implemented as pure transitions so they are
  unit-testable without React.
- **Alternatives considered**: Redux Toolkit (rejected — heavier, boilerplate for one
  screen); Zustand holding full item objects (rejected — violates the user constraint and
  invites drift); React Query mutations for equip state (rejected — equip state is client
  session state, not server state; misusing the cache for it fights invalidation
  semantics).

## R3. Data layer — local mocks behind React Query

- **Decision**: Static typed modules `mocks/items.ts` (≥10 items covering all 7 slot
  types, per FR-013) and `mocks/character.ts`, exposed through async functions in
  `mocks/api.ts` that resolve after a small simulated delay (~150 ms). Consumed via
  `useQuery({ queryKey: queryKeys.items, queryFn: fetchItems, staleTime: Infinity })`.
- **Rationale**: User-mandated (no backend, React Query retrieval). `staleTime: Infinity`
  is correct because mock data never changes — no refetch churn during drags. The
  simulated delay forces real loading states to exist (Constitution III: designed
  loading/empty/error states) and keeps the seam ready for a real API later.
- **Alternatives considered**: MSW (Mock Service Worker) intercepting `fetch` (rejected
  for v1 — adds a dependency and service-worker complexity with no consumer benefit;
  the async-function seam is equivalent for React Query); importing mock data directly
  into components (rejected — bypasses React Query, violating the user's data-flow
  mandate and losing loading-state discipline).

## R4. Drag and drop — dnd-kit architecture

- **Decision**: Single `DndContext` at the screen root. Every inventory cell and
  equipment slot is a `useDroppable` target; every item tile is a `useDraggable` source
  with `data: { itemId, slotType, origin }`. Use `DragOverlay` to render the dragged item
  (transform-based, follows pointer at 60 fps without reflow). Collision detection:
  `pointerWithin` with `rectIntersection` fallback. Validity (item slotType vs. slot
  type) is computed in `onDragOver` to drive highlight state (FR-005) and enforced in
  `onDragEnd`, which dispatches exactly one store action: `equip`, `swap`, `unequip`,
  `moveInBag`, or `cancelDrag` (FR-003, FR-007, FR-008, FR-012).
- **Rationale**: User-mandated library. `DragOverlay` is the documented pattern for
  smooth cross-container drags and satisfies SC-003 (no lag/stutter). Centralizing
  outcome resolution in `onDragEnd` produces a single serializable "drop outcome" value —
  the natural trigger point for both the store transition and the one sound effect
  (SC-004, exactly-once).
- **Accessibility best practice**: enable `KeyboardSensor` alongside `PointerSensor` and
  provide dnd-kit `announcements` for screen readers (Constitution III: keyboard
  operability).
- **Alternatives considered**: HTML5 native drag-and-drop (rejected — poor touch support,
  ugly default ghost images, weak styling control); react-dnd (rejected — user mandated
  dnd-kit; also heavier abstraction); pragmatic-drag-and-drop (rejected — not mandated).

## R5. Animation — Framer Motion scope

- **Decision**: Framer Motion is used for (a) equip/unequip slot transitions
  (`AnimatePresence` + scale/opacity on slot contents), (b) stat-delta highlight pulses in
  the stat panel (FR-014/US2-AS4), and (c) menu/overlay animation (mute control,
  invalid-drop feedback flash). It is **not** used for drag tracking — dnd-kit's
  transform handles that.
- **Rationale**: User-mandated for "menu and equip/unequip animations". Keeping Framer
  Motion off the drag hot path avoids animation-library/drag-library fighting over
  transforms and protects the 60 fps budget. All animations use `transform`/`opacity`
  only (compositor-friendly), and respect `prefers-reduced-motion` via Framer's
  `useReducedMotion` (Constitution III accessibility).
- **Alternatives considered**: CSS transitions only (rejected — user mandated Framer
  Motion; `AnimatePresence` exit animations for unequip are painful in raw CSS);
  animating the drag itself with Framer Motion (rejected — conflicts with dnd-kit
  transforms).

## R6. Styling — Tailwind CSS as the design system

- **Decision**: Tailwind CSS (v3.4+) with a `theme.extend` defining project tokens:
  slot-state colors (`slot-valid`, `slot-invalid`, `slot-idle`), stat-delta colors
  (buff/debuff), spacing scale for the grid, and font tokens. Component variants live in
  small typed helper maps, not ad-hoc class strings scattered per usage.
- **Rationale**: User-mandated ("Tailwind for all styling"). Centralizing tokens in the
  Tailwind theme is how this project satisfies Constitution III's "single shared design
  system" without adding a component library. Contrast-checked token pairs meet WCAG 2.1
  AA.
- **Alternatives considered**: CSS Modules (rejected — user mandated Tailwind);
  shadcn/ui or other component kits (rejected — unneeded footprint for one screen;
  simplicity default).

## R7. Sound effects — Web Audio strategy

- **Decision**: Preload the four effects (pickup, equip, unequip, invalid) as decoded
  `AudioBuffer`s in a lazily-created `AudioContext`. A `useSound` hook exposes
  `play(effect)` which (a) no-ops when `muted`, (b) creates a fresh
  `AudioBufferSourceNode` per play (allowing overlap-free rapid retriggering), and (c) is
  invoked only from the single drop-outcome resolution point and `onDragStart` — one call
  site per interaction guarantees exactly-once playback (SC-004, FR-009/FR-010/FR-011).
  The `AudioContext` is created/resumed on the first user gesture; before that, plays
  silently no-op (spec edge case: autoplay restrictions).
- **Rationale**: Web Audio API beats `<audio>` elements for low-latency, rapid-fire game
  SFX and needs no dependency. Sourcing sounds as small local `.mp3`/`.ogg` assets keeps
  the bundle bounded. Public-domain/CC0 assets (e.g., Kenney.nl UI audio packs) avoid
  licensing issues.
- **Alternatives considered**: Howler.js (rejected — capable but an extra dependency for
  four one-shot sounds; simplicity default); `<audio>` tag pool (rejected — latency and
  replay-race quirks under rapid interaction, risking SC-004/SC-006).

## R8. Testing stack

- **Decision**: Vitest (native Vite integration) + React Testing Library + user-event.
  Layers: **unit** — `stats.ts` effective-stat math (incl. negative-modifier clamping)
  and Zustand store transitions (equip/swap/unequip/full-bag rejection) as pure
  functions; **contract** — Zod schemas from `contracts/` validate `mocks/items.ts`
  (all 7 slot types covered, ≥10 items) and `mocks/character.ts`; **integration** —
  RTL tests over the composed screen: drag flows via dnd-kit keyboard sensor simulation,
  sound-called-exactly-once spies, mute honored, 20-rapid-operation consistency
  (SC-006). Audio is mocked at the `useSound` boundary.
- **Rationale**: Constitution II is non-negotiable; pure-function extraction of stats and
  store transitions makes red-green TDD practical before UI exists. Keyboard-sensor-driven
  integration tests avoid brittle pointer-coordinate simulation while still exercising
  real dnd-kit wiring.
- **Alternatives considered**: Jest (rejected — duplicate transform config alongside
  Vite); Playwright E2E for v1 (deferred — valuable later for real pointer drags, but
  unit + RTL integration covers the acceptance scenarios; noted as a follow-up).

## R9. Character generation

- **Decision**: "Generated character" = deterministic-random composition at load time
  from a small set of local SVG/layered parts and randomized base stats within defined
  ranges, produced by `mocks/character.ts` and fetched via React Query like any other
  entity.
- **Rationale**: Matches the spec assumption (randomized or preset appearance, no user
  authoring). SVG parts keep bundle size trivial and scale cleanly around the slot
  layout.
- **Alternatives considered**: Third-party avatar libraries (rejected — dependency for a
  placeholder-grade need); canvas/WebGL rendering (rejected — massive overkill for v1).

---

**All Technical Context entries resolved. No NEEDS CLARIFICATION items remain.**
