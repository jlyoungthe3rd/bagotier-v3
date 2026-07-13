# Research: Keyboard Inventory Navigation

**Feature**: `004-keyboard-inventory-nav` | **Date**: 2026-07-12

## R1. Keyboard Navigation Pattern (Roving tabindex vs Grid pattern)

- **Decision**: Implement a **roving `tabindex`** pattern across the inventory bag (24 cells) and the paper doll (7 slots).
- **Rationale**: 
  - Having 24 separate tab stops in the bag would create a poor user experience, requiring the user to press Tab 24 times to bypass the inventory.
  - A roving `tabindex` means only one cell in the bag (the active/focused cell) and one slot in the paper doll is in the tab order at any time (`tabIndex={0}`). All other cells/slots have `tabIndex={-1}`.
  - This allows the user to Tab into the active cell, use arrow keys to navigate within the bag, press Tab to move to the active slot in the paper doll, use arrow keys to navigate the paper doll, and press Tab again to exit the entire inventory system.
- **Alternatives considered**:
  - *Standard Tab navigation for all slots*: Rejected due to poor UX (too many Tab presses).
  - *Custom focus management outside DOM focus*: Rejected because it breaks screen readers and native accessibility indicators.

## R2. Keyboard Grid Geometry and Wrapping

- **Decision**: 
  - The inventory bag is represented as a 6-row by 4-column grid (24 cells total).
  - Row calculations: `row = Math.floor(index / 4)`, `col = index % 4`.
  - Arrow key actions:
    - **Right**: Increment index by 1. Wrap to next row if `index % 4 !== 3` is not violated. If `index === 23`, ignore/block.
    - **Left**: Decrement index by 1. Wrap to previous row if `index % 4 !== 0` is not violated. If `index === 0`, ignore/block.
    - **Down**: Move to `index + 4`. Block if `index + 4 >= 24`.
    - **Up**: Move to `index - 4`. Block if `index - 4 < 0`.
  - The paper doll visual structure:
    - Order of slots: `head`, `weapon`, `hands`, `body`, `accessory`, `legs`, `feet`.
    - Since the paper doll has a spatial layout, we will map Up/Down arrow keys to cycle through slots in a logical vertical-ish order:
      - `head` ↔ `body` / `weapon` / `accessory` ↔ `hands` ↔ `legs` ↔ `feet`.
      - To keep navigation simple and predictable, we can define a deterministic bidirectional navigation chain or direct directional mapping between the 7 slots:
        - Down from `head` → `body`
        - Up from `body` → `head`, Down from `body` → `legs`
        - Up from `legs` → `body`, Down from `legs` → `feet`
        - Up from `feet` → `legs`
        - Right from `weapon` → `body` ↔ Right to `accessory` (Left goes back)
        - Weapon and Hands on the left column: `weapon` ↔ `hands` via Up/Down.
        - Accessory and Body on the right column/center: `body` ↔ `accessory` via Up/Down or Left/Right.
        - Let's design a simple, intuitive grid/directional map for the paper doll slots:
          - `head`: Up/Down transitions, Left/Right transitions.
          - Let's specify exact transitions:
            - **Head**: Down → Body, Left → Weapon, Right → Accessory
            - **Weapon**: Up → Head, Down → Hands, Right → Body
            - **Hands**: Up → Weapon, Down → Legs, Right → Accessory
            - **Body**: Up → Head, Down → Legs, Left → Weapon, Right → Accessory
            - **Accessory**: Up → Head, Down → Feet, Left → Body
            - **Legs**: Up → Body, Down → Feet, Left → Hands, Right → Accessory
            - **Feet**: Up → Legs, Left → Hands, Right → Accessory
- **Rationale**: Keeps paper doll navigation natural and aligned with the spatial layout.

## R3. Tab Hook and Section Transitioning

- **Decision**: 
  - Manage a global `keyboardFocus` state in the Zustand store to coordinate the currently focused target.
  - When the Bag has focus, intercept `Tab` key down. Instead of letting the browser move focus to the next DOM element naturally, programmatically focus the active paper doll slot.
  - When the Paper Doll has focus, intercept `Shift+Tab` key down to programmatically focus the active bag cell.
  - Standard `Tab` from the paper doll, or `Shift+Tab` from the bag, will propagate normally to let the browser focus out of the widget.
- **Rationale**: Meets FR-006 exactly while maintaining native browser tab flow outside the widget.

## R4. Tooltip and Action Integrations

- **Decision**:
  - Both occupied and empty cells/slots will render a focusable `<button>`.
  - Occupied buttons render `InventoryItem` with existing focus/blur tooltip triggers.
  - Empty buttons render empty cell/slot visuals, with `tabIndex` set dynamically, and a focus/blur handler that dismisses the tooltip.
  - When Space or Enter is pressed on an occupied cell/slot button, dispatch the corresponding store actions (`equip` / `swap` / `unequip`).
- **Rationale**: Reuses the existing robust tooltip state and dnd action dispatch pipelines.

## R5. Tab Hint Tooltip

- **Decision**:
  - Show a small tooltip bubble near the character view reading: `"Press TAB to switch to the paper doll"`.
  - Trigger condition: User presses any arrow key inside the inventory grid AND `tabHintDismissed` is false.
  - Dismiss condition: Focus enters the paper doll (either via TAB or click). Once dismissed, set `tabHintDismissed: true` in the Zustand store (session-only).
- **Rationale**: Meets FR-013, FR-014, and FR-015, and is non-intrusive.
