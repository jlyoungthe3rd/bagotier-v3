# Quickstart: Icon-Only Inventory Slots

**Feature**: `003-icon-only-inventory` | Validation/run guide

## Prerequisites

- Node.js and npm installed
- Repository dependencies installed (`npm install`)

## Run

```bash
npm run dev
```

Open the app in the local Vite URL.

## Test commands

```bash
npm test
npm run lint
```

## Validation scenarios

### V1 — Occupied slots are icon-only (FR-001, FR-002, FR-006)

1. Seed inventory with multiple items.
2. Open inventory.
3. Confirm each occupied inventory block displays only the icon visually.
4. Confirm no item-name text appears inside any occupied block.

### V2 — Slot states remain understandable (FR-003)

1. View a mix of occupied, empty, and unavailable/locked slots.
2. Confirm states remain distinguishable via existing slot visuals (borders/background/state cues), not text labels.

### V3 — Icon fallback is text-free (FR-005)

1. Simulate an item with missing/invalid icon data.
2. Confirm block renders the defined fallback visual.
3. Confirm no fallback text appears inside the block.

### V4 — Metadata remains available outside slot interior (FR-004)

1. Inspect item tile accessibility label.
2. Confirm item identity remains available to assistive technology/non-slot contexts while in-slot text stays removed.

## References

- Rendering rules: [contracts/inventory-slot-ui-contract.md](./contracts/inventory-slot-ui-contract.md)
- Data expectations: [data-model.md](./data-model.md)
- Decisions: [research.md](./research.md)
