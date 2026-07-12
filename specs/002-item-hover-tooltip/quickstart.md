# Quickstart: Item Hover Tooltip

**Feature**: `002-item-hover-tooltip` | Validation/run guide

## Prerequisites

- Node.js and npm installed
- Dependencies installed:

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open the local Vite URL and navigate to inventory/equipment views.

## Test commands

```bash
npm test
npm run lint
npm run build
```

## Validation scenarios

### V1 — Tooltip opens and closes on item hover (FR-001, FR-003, SC-001, SC-002)

1. Hover an item with tooltip-enabled content.
2. Confirm tooltip appears near the item with mapped details within 0.2s.
3. Move pointer away.
4. Confirm tooltip closes within 0.2s.

### V2 — Content matches the active hovered item and remains singular (FR-002, FR-004, FR-008)

1. Hover item A; verify tooltip details correspond to item A.
2. Move directly to adjacent item B.
3. Verify item A tooltip is replaced by item B tooltip with no overlap or duplicate tooltip nodes.

### V3 — Viewport-safe placement and low obstruction (FR-005, User Story 2)

1. Hover items near each viewport edge/corner.
2. Confirm tooltip remains fully visible in viewport.
3. Confirm placement does not fully cover the trigger item in typical layouts.

### V4 — Empty-content and non-blocking behavior (FR-006, FR-007)

1. Simulate an item with missing/empty tooltip mapping.
2. Confirm no empty tooltip appears.
3. With another tooltip visible, interact with nearby unrelated controls.
4. Confirm controls remain usable.

### V5 — Keyboard accessibility parity (Research R1)

1. Focus an item trigger via keyboard navigation.
2. Confirm tooltip appears with `role="tooltip"` semantics.
3. Press `Escape`; confirm tooltip closes while focus remains on trigger context.

### V6 — Non-blocking control interactions while tooltip is visible (FR-006)

1. Hover any inventory item to open a tooltip.
2. Click the sound toggle control without moving the pointer away from the hovered trigger.
3. Confirm the sound toggle still updates state (Mute ↔ Unmute) while tooltip remains non-interactive.

## References

- Feature requirements: [spec.md](./spec.md)
- Decisions and rationale: [research.md](./research.md)
- Runtime entities and transitions: [data-model.md](./data-model.md)
- UI behavior contract: [contracts/item-tooltip-ui-contract.md](./contracts/item-tooltip-ui-contract.md)
