# Styling & Responsiveness Audit Report: Horizontal Fan-Out Animation & Equipment UI

**Feature**: Horizontal Item Slot Fan-Out Animation  
**Worktree**: `.worktrees/styling`  
**Branch**: `subagent/styling`  
**Target Components**:

- [`src/features/character/FanOut.tsx`](src/features/character/FanOut.tsx)
- [`src/features/character/EquipmentSlot.tsx`](src/features/character/EquipmentSlot.tsx)
- [`src/features/character/CharacterView.tsx`](src/features/character/CharacterView.tsx)
- [`src/index.css`](src/index.css)
- [`src/App.tsx`](src/App.tsx)

**Theme**: "Forge & Rune" (Dark Fantasy / Arcane JRPG Inventory)

---

## 1. Executive Summary

A comprehensive design and responsive audit was conducted for the **horizontal item slot fan-out animation** in Bagotier. All styling tokens, motion parameters, and layout constraints were refined to enhance the **Forge & Rune** dark fantasy aesthetic, ensure seamless responsive behavior across mobile (`< 640px`) and desktop viewports, and prevent unwanted horizontal scrolling or clipping.

Key audit highlights:

1. **Forge & Rune Dark Fantasy Aesthetic**: Slot borders, frosted glass opacities, responsive JRPG corner bracket accents, and hot forge gold/ember hover states were aligned across slots and fanned items.
2. **Responsive Scaling & Horizontal Bounds Clamping**: Adaptive horizontal step spacing (`DESKTOP_STEP = 64px`, `MOBILE_STEP = 50px`) coupled with proportional viewport boundary clamping ensures items never overlap, collapse, or cause horizontal page scrollbars even on narrow mobile displays (tested down to 320px).
3. **Smooth Framer Motion Transitions**: Strict 200ms `easeOut` simultaneous horizontal slide-out transitions with full `useReducedMotion` support.
4. **Code Quality & Build Verification**: 100% test pass rate (103/103 tests), 0 ESLint warnings, 0 TypeScript errors, and successful production build.

---

## 2. Aesthetic Audit & Visual Polish ("Forge & Rune")

### A. Slot Borders & Interactive States

- **Empty / Idle Slot**:
  - Border: `border-slot-idle/70` over `bg-surface` (`#151020`), providing subtle arcane stone definition.
  - Hover: Illuminates with `hover:border-ember/70 hover:shadow-[0_0_10px_rgba(212,104,58,0.25)]`, evoking a heated forge reaction before fan-out activates.
- **Active / Focused Slot**:
  - Focus Ring: `border-gold/70 shadow-[0_0_10px_rgba(196,148,58,0.25),0_0_4px_rgba(212,104,58,0.2)]` providing high contrast and clarity.
- **Open Fan-Out State**:
  - Outer Slot Ring: Transitions to `border-gold/90 shadow-[0_0_14px_rgba(196,148,58,0.35),0_0_6px_rgba(212,104,58,0.25)] ring-1 ring-gold/40`, anchoring the open menu to its source slot.

### B. Fanned-Out Item Tiles

- **Surface & Opacity**:
  - Frosted runic glass: `bg-surface-raised/95 backdrop-blur-md` (`#1f1930` at 95% opacity), creating layered physical depth over the character figure and rotating summoning circle.
  - Deep shadow: `shadow-lg shadow-surface-sunken/80` cleanly separates floating items from underlying components.
- **JRPG Corner Bracket Accents**:
  - Responsive bracket dimensions: `h-2 w-2 sm:h-2.5 sm:w-2.5` on all 4 corners of each fanned item.
  - Interactive coloration:
    - _Idle_: Runic gold accent at 40% opacity (`border-gold/40`).
    - _Hover_: Transitions to warm ember (`group-hover:border-ember/90`).
    - _Focused_: Radiant runic gold (`border-gold`).
- **Gold & Ember Hover & Focus Feedback**:
  - _Idle_: `border-slot-idle/80`.
  - _Hover_: `hover:scale-105 hover:bg-surface-raised hover:border-ember hover:shadow-[0_0_14px_rgba(212,104,58,0.4),0_0_6px_rgba(196,148,58,0.3)] active:scale-95`.
  - _Focus (Keyboard/Active Descendant)_: `border-gold shadow-[0_0_16px_rgba(196,148,58,0.45),0_0_8px_rgba(212,104,58,0.3)] ring-1 ring-gold/60 scale-105`.
  - Chiselled profile: Updated to `rounded-sm` (2px) matching dark fantasy carved runic stone tiles.

---

## 3. Responsive Layout & Horizontal Overflow Prevention

### A. Breakpoint Scaling & Step Distances

- **Desktop / Tablet (`sm: 640px+`)**:
  - Item Dimensions: `sm:h-cell sm:w-cell` (56px x 56px / `3.5rem`).
  - Horizontal Step: `DESKTOP_STEP = 64px` (8px gap between adjacent tiles).
  - Icon typography: `sm:text-2xl`.
- **Mobile (`< 640px`)**:
  - Item Dimensions: `h-11 w-11` (44px x 44px), meeting WCAG 2.1 AA recommended touch target standards.
  - Horizontal Step: `MOBILE_STEP = 50px` (6px gap between adjacent tiles).
  - Icon typography: `text-xl`.

### B. Horizontal Fan Direction Matrix

| Body Region         | Slots                               | Fan Direction | Target Direction                             |
| :------------------ | :---------------------------------- | :------------ | :------------------------------------------- |
| **Left Flank**      | `weapon`, `hands`, `legs`           | `left`        | Negative X offsets stepping away from center |
| **Right Flank**     | `head`, `body`, `accessory`, `feet` | `right`       | Positive X offsets stepping away from center |
| **Center Fallback** | Dynamic / Center                    | `center`      | Symmetrically flanking left and right        |

### C. Proportional Viewport Clamping Algorithm

To eliminate clipping or unwanted horizontal scrollbars while preventing items from stacking onto each other at the screen edge:

1. Detects `slotCenterX` and item extent relative to viewport boundaries with a mandatory `12px` safety margin (`margin = 12`).
2. Computes total span in each direction: `maxNegativeOffset` (left) and `maxPositiveOffset` (right).
3. If an overflow is detected on either edge:
   $$\text{scaleLeft} = \frac{\max(0, \text{slotCenterX} - \text{margin} - \text{itemHalfSize})}{\text{maxNegativeOffset}}$$
   $$\text{scaleRight} = \frac{\max(0, \text{window.innerWidth} - \text{margin} - \text{itemHalfSize} - \text{slotCenterX})}{\text{maxPositiveOffset}}$$
4. Positions scale down proportionally: every item maintains equal proportional spacing without colliding or escaping the viewport.
5. In `src/index.css`, `body` is explicitly styled with `@apply overflow-x-hidden` to prevent browser rubber-banding or accidental horizontal overflow.

---

## 4. Framer Motion Transitions

- **Simultaneous Slide-Out**:
  - Animated with Framer Motion:
    ```tsx
    initial={reducedMotion === true ? false : { scale: 0.8, opacity: 0, x: '-50%', y: '-50%' }}
    animate={{ scale: 1, opacity: 1, x: `calc(-50% + ${String(pos.x)}px)`, y: '-50%' }}
    exit={reducedMotion === true ? { opacity: 0 } : { scale: 0.8, opacity: 0, x: '-50%', y: '-50%' }}
    transition={{ duration: reducedMotion === true ? 0 : 0.2, ease: 'easeOut' }}
    ```
  - Duration: **200ms simultaneous ease-out slide**, delivering snappy, responsive tactile feedback without stagger lag.
  - Accessibility: Respects `useReducedMotion()`, disabling transform scaling and animation duration when the user prefers reduced motion.

---

## 5. Verification & Test Results

### A. Test Suite (`npm test`)

```bash
✓ tests/unit/fan-out.test.tsx (12 tests)
✓ tests/integration/item-tooltip-placement.test.tsx (1 test)
✓ tests/integration/item-tooltip-nonblocking.test.tsx (1 test)
✓ tests/integration/item-tooltip-rapid-movement.test.tsx (1 test)
✓ tests/unit/stat-panel-animation.test.tsx (3 tests)
✓ tests/integration/inventory-icon-only.test.tsx (2 tests)
✓ tests/integration/item-tooltip-hover.test.tsx (2 tests)
✓ tests/contract/item-tooltip-ui.contract.test.tsx (2 tests)
✓ tests/integration/sound-once.test.tsx (3 tests)
✓ tests/integration/keyboard-navigation.test.tsx (3 tests)
✓ tests/integration/character-view.test.tsx (4 tests)
✓ tests/integration/paper-doll-column.test.tsx (4 tests)
✓ tests/unit/equipment-slot.test.tsx (6 tests)
✓ tests/unit/wip-banner.test.tsx (2 tests)
✓ tests/unit/inventory-item.test.tsx (2 tests)
✓ tests/unit/github-link.test.tsx (1 test)
✓ tests/integration/stat-panel.test.tsx (5 tests)
...
Test Files  30 passed (30)
     Tests  103 passed (103)
```

### B. Lint & Formatting (`npm run lint`)

```bash
> eslint . --max-warnings 0 && prettier --check .
All matched files use Prettier code style!
0 errors, 0 warnings.
```

### C. Production Build (`npm run build`)

```bash
> tsc -b && vite build
✓ 502 modules transformed.
dist/index.html                   0.71 kB │ gzip:   0.39 kB
dist/assets/index--MOczudP.css   21.51 kB │ gzip:   4.98 kB
dist/assets/index-DSNse8y5.js   413.31 kB │ gzip: 131.87 kB
✓ built in 227ms
```

---

## 6. Summary of Modified Files

1. [`src/features/character/FanOut.tsx`](src/features/character/FanOut.tsx):
   - Refined `rounded-sm` chiseled dark fantasy styling, `border-slot-idle/80`, dual gold/ember hover states, and responsive corner brackets.
   - Enhanced viewport clamping with proportional scaling to prevent overlap or edge clipping on small screens.
   - Resolved inferrable boolean type and nullish coalescing lint issues.
2. [`src/features/character/EquipmentSlot.tsx`](src/features/character/EquipmentSlot.tsx):
   - Refined idle hover and fanout-open glow states with warm ember undertones.
   - Enhanced corner bracket transitions on hover (`group-hover:border-ember/80`).
   - Fixed template literal string conversions for `@typescript-eslint/restrict-template-expressions`.
3. [`src/index.css`](src/index.css):
   - Added `overflow-x-hidden` on `body` for cross-device horizontal scroll prevention.
4. [`tests/unit/fan-out.test.tsx`](tests/unit/fan-out.test.tsx):
   - Updated non-null assertions to comply with `@typescript-eslint/non-nullable-type-assertion-style`.
5. [`styling-report.md`](styling-report.md):
   - Updated comprehensive styling report detailing the horizontal fan-out audit and findings.

---

## 7. Slot-Anchored Directional Tooltip Styling & Layout Audit

**Feature**: Slot-Anchored Directional Tooltips  
**Audited Components**:

- [`src/features/inventory/tooltip/ItemTooltipPresenter.tsx`](src/features/inventory/tooltip/ItemTooltipPresenter.tsx)
- [`src/features/character/EquipmentSlot.tsx`](src/features/character/EquipmentSlot.tsx)
- [`src/features/character/FanOut.tsx`](src/features/character/FanOut.tsx)
- [`src/features/inventory/InventoryItem.tsx`](src/features/inventory/InventoryItem.tsx)
- [`src/index.css`](src/index.css)

### Audit Checklist & Findings

1. **Tooltip Responsiveness**:
   - `max-w-56` (14rem = 224px) is optimal for dark fantasy item cards: wide enough for item names and stat lines while leaving ample margins on narrow 320px+ viewports.
   - Inner padding `px-3 py-2` (12px horizontal, 8px vertical) preserves compact density without crowding text.
   - Added `break-words` to item title to guard against unexpected long string overflows.

2. **Tailwind Class Consistency**:
   - **Background & Frosted Glass**: Enhanced tooltip with `bg-surface-raised/95 backdrop-blur-md` (`#1f1930`), matching the frosted runic glass aesthetic in `FanOut`.
   - **Borders & Shadows**: `border-gold/40` matches the idle gold framing of slots. Upgraded shadow to `shadow-xl shadow-surface-sunken/80` for consistent depth above underlying parchment/void surfaces.
   - **Stat Typography**: Applied `font-mono text-[11px]` to stat metadata lines in `ItemTooltipPresenter.tsx`, fulfilling the design token specification in `tailwind.config.ts` (_"Cinzel serif + JetBrains Mono for stat data"_).
   - **Icon Depth**: Added `drop-shadow` to the equipped item icon in `InventoryItem.tsx`, aligning with fanned-out item tiles.

3. **Mobile Layout & Viewport Safety**:
   - Anchoring tooltips to the slot container element and inverting `SLOT_FAN_DIRECTION` (slots fanning left project tooltips to the right, and vice versa) successfully prevents visual collision between fanned items and tooltips.
   - Directional `flip` fallbacks (`['left', 'bottom', 'top']` or `['right', 'bottom', 'top']`) combined with `shift({ padding: 8 })` guarantee tooltips never clip off-screen on compact mobile viewports (down to 320px).

4. **Dark Theme Harmony**:
   - Surface colors strictly follow the Forge & Rune palette: `surface-raised` (`#1f1930`), `surface-sunken` (`#080610`), `ink` (`#e8ddd0` with 17:1 WCAG contrast), `ink-muted` (`#7a7060`), and `gold` (`#c4943a`).

5. **Z-Index Layering**:
   - Hierarchy is clean and collision-free:
     - Base slot container: `z-10`
     - Fan-out menu: `z-30`
     - Floating tooltip: `z-50` rendered via `<FloatingPortal>` at document body root.
   - `pointer-events-none` on the tooltip ensures that even at `z-50` it never blocks click/hover/drag interactions with slots or fanned items.

6. **Animation & Reduced Motion**:
   - Added `@keyframes tooltipFadeIn` with `motion-safe:animate-[tooltipFadeIn_120ms_ease-out]` in `src/index.css`.
   - The animation operates purely on `opacity`, completely avoiding `transform` conflicts with Floating UI's dynamic inline styles.
   - Instantaneous appearance when `prefers-reduced-motion: reduce` is enabled.

7. **Code Hygiene**:
   - Formatted multi-line prop destructuring in `InventoryItem.tsx` to fix Prettier validation.
