# Feature Specification: Keyboard Inventory Navigation

**Feature Branch**: `004-keyboard-inventory-nav`

**Created**: 2026-07-12

**Status**: Completed

**Input**: User description: "Add a feature that allows a keyboard user to navigate the inventory grid using the arrow keys. They can use TAB to switch between the inventory grid and the paper doll. If a user hits spacebar or enter the selected item will equip to the correct slot (or unequip if they are navigating the paper doll container). The tooltip should display same as when a mouseOver happens. If a user attempts to use the keyboard to navigate the inventory grid, show a small tooltip over the paper doll that lets the user know they can use TAB to select the paper doll."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Inventory Grid with Arrow Keys (Priority: P1)

As a keyboard user, I can move focus through the inventory grid using the arrow keys so I can browse all my items without using a mouse.

**Why this priority**: This is the foundational interaction — without grid navigation, all other keyboard behaviors have no starting point. Every other story depends on this working correctly.

**Independent Test**: Can be fully tested by pressing any arrow key while the inventory grid has focus and confirming focus visually moves between slots in the expected direction, wrapping or stopping at edges.

**Acceptance Scenarios**:

1. **Given** the inventory grid has focus and the cursor is on a slot, **When** the user presses the Right arrow key, **Then** focus moves to the next slot in the same row.
2. **Given** the inventory grid has focus and the cursor is on a slot, **When** the user presses the Left arrow key, **Then** focus moves to the previous slot in the same row.
3. **Given** the inventory grid has focus and the cursor is on a slot, **When** the user presses the Down arrow key, **Then** focus moves to the slot directly below in the grid.
4. **Given** the inventory grid has focus and the cursor is on a slot, **When** the user presses the Up arrow key, **Then** focus moves to the slot directly above in the grid.
5. **Given** the inventory grid has focus and the cursor is on the last slot in a row, **When** the user presses the Right arrow key, **Then** focus wraps to the first slot of the next row (or stops at the final slot if it is the last row).
6. **Given** the inventory grid has focus and the cursor is on the first slot in a row, **When** the user presses the Left arrow key, **Then** focus wraps to the last slot of the previous row (or stops at the first slot if it is the first row).
7. **Given** the inventory grid has focus and the cursor is on a slot in the top row, **When** the user presses the Up arrow key, **Then** focus remains on the current slot (no wrap-around to the last row).
8. **Given** the inventory grid has focus and the cursor is on a slot in the bottom row, **When** the user presses the Down arrow key, **Then** focus remains on the current slot (no wrap-around to the first row).

---

### User Story 2 - Tooltip Displays for Keyboard-Focused Item (Priority: P2)

As a keyboard user, I can see the same item tooltip that mouse users see when I navigate to an item in the inventory grid or paper doll, so I have equal access to item details.

**Why this priority**: Tooltip parity is a direct accessibility requirement — keyboard users must receive the same information mouse users receive without additional effort.

**Independent Test**: Can be fully tested by navigating to any occupied inventory slot with the keyboard and confirming the item tooltip appears, containing the same content that a mouse-hover would produce.

**Acceptance Scenarios**:

1. **Given** the inventory grid has keyboard focus on a slot containing an item, **Then** the item tooltip is shown, identical to the tooltip shown on mouse hover.
2. **Given** the inventory grid has keyboard focus, **When** focus moves to an empty slot, **Then** no tooltip is shown.
3. **Given** a tooltip is visible for a keyboard-focused slot, **When** the user moves focus to a different slot, **Then** the previous tooltip closes and the new slot's tooltip (if applicable) appears.
4. **Given** the paper doll has keyboard focus on an equipped slot, **Then** the tooltip for the equipped item is shown.
5. **Given** the paper doll has keyboard focus on an empty equipment slot, **Then** no tooltip is shown.

---

### User Story 3 - Equip and Unequip Items with Keyboard Confirmation (Priority: P2)

As a keyboard user, I can press Space or Enter to equip the currently focused inventory item to the correct slot, or unequip an item from the paper doll, so I can manage my equipment entirely with the keyboard.

**Why this priority**: Navigation without action is incomplete — users need to be able to act on the selected item. Tied with tooltip display since both make the navigation feature meaningful.

**Independent Test**: Can be fully tested by navigating to an equipped inventory item with the keyboard and pressing Space or Enter, then verifying the item moves to the correct equipment slot on the paper doll (and vice-versa for unequipping from the paper doll).

**Acceptance Scenarios**:

1. **Given** the inventory grid has keyboard focus on an occupied slot with an equippable item, **When** the user presses Space or Enter, **Then** the item is equipped to its corresponding paper doll slot, following the same rules as drag-and-drop equipping.
2. **Given** the inventory grid has keyboard focus on an occupied slot with an item that cannot be equipped (e.g., it has no valid equipment slot), **When** the user presses Space or Enter, **Then** no equip action occurs and focus remains on the slot.
3. **Given** the paper doll has keyboard focus on an occupied equipment slot, **When** the user presses Space or Enter, **Then** the equipped item is unequipped and returned to the inventory.
4. **Given** the paper doll has keyboard focus on an empty equipment slot, **When** the user presses Space or Enter, **Then** no action occurs and focus remains on the slot.
5. **Given** an item is equipped via the keyboard, **Then** the inventory grid and paper doll visually update immediately to reflect the change.

---

### User Story 4 - Switch Focus Between Inventory Grid and Paper Doll with TAB (Priority: P3)

As a keyboard user, I can press TAB to move focus between the inventory grid and the paper doll so I can switch between browsing and managing equipment without reaching for the mouse.

**Why this priority**: TAB switching ties the two navigation contexts together. It is important for a complete keyboard workflow but depends on grid navigation (P1) and equip/unequip (P2) being in place to provide its full value.

**Independent Test**: Can be fully tested by pressing TAB while the inventory grid has focus and confirming focus moves to the paper doll, and pressing TAB again (or Shift+TAB) to return focus to the inventory grid.

**Acceptance Scenarios**:

1. **Given** the inventory grid has keyboard focus, **When** the user presses TAB, **Then** focus moves to the paper doll and the first occupied (or first available) slot on the paper doll becomes the active slot.
2. **Given** the paper doll has keyboard focus, **When** the user presses Shift+TAB, **Then** focus returns to the inventory grid at the previously focused slot (or the first slot if no prior position is remembered).
3. **Given** the paper doll has keyboard focus, **When** the user presses TAB, **Then** focus moves to the next natural tab stop in the page (standard browser TAB behavior continues outside the inventory components).
4. **Given** either the inventory grid or paper doll has keyboard focus, **When** the user presses TAB or Shift+TAB, **Then** the active component is visually indicated with a distinct focus ring.

---

### User Story 5 - Paper Doll TAB Hint Tooltip for New Keyboard Users (Priority: P3)

As a keyboard user who is actively navigating the inventory grid for the first time, I see a small contextual hint near the paper doll indicating I can press TAB to switch focus, so I can discover the full keyboard workflow without consulting external help.

**Why this priority**: Discoverability is important but lower priority than the core interactions. The feature is still fully functional without this hint; it only reduces the learning curve.

**Independent Test**: Can be fully tested by triggering arrow-key navigation within the inventory grid and confirming a hint tooltip appears near the paper doll, and that it dismisses once focus switches to the paper doll.

**Acceptance Scenarios**:

1. **Given** the user has not yet used TAB to reach the paper doll in this session, **When** the user begins navigating the inventory grid with arrow keys, **Then** a small hint tooltip appears near the paper doll reading something equivalent to "Press TAB to switch to the paper doll."
2. **Given** the TAB hint tooltip is visible, **When** the user presses TAB to switch focus to the paper doll, **Then** the hint tooltip dismisses.
3. **Given** the user has already dismissed the hint tooltip this session (by tabbing to the paper doll), **When** the user returns to navigating the inventory grid with arrow keys, **Then** the hint tooltip does not reappear for the remainder of the session.
4. **Given** the user is navigating the inventory grid with the mouse (no arrow key usage), **When** the paper doll is visible, **Then** the hint tooltip is not shown.

---

### Edge Cases

- What happens when the inventory grid is empty (all slots empty)? Focus should still enter the grid and arrow keys should move through empty slots without error.
- What happens when the paper doll has no items equipped? Arrow keys should still navigate between equipment slots on the paper doll without error.
- What happens if an inventory item is equippable but the corresponding paper doll slot is already occupied? The equip action should follow the same resolution logic as the existing drag-and-drop flow (e.g., swap or block, consistent with current behavior).
- What happens when the user uses keyboard navigation and a tooltip would be cut off at the viewport edge? Tooltip positioning follows the same smart-positioning rules already established for mouse-hover tooltips.
- What happens when the user presses Space or Enter rapidly on the same slot multiple times? The action should be idempotent or correctly toggle equip/unequip without producing duplicate state changes.
- What happens if focus is inside the inventory grid and the user presses TAB and there are no equipped items on the paper doll? Focus moves to the paper doll and the first available equipment slot receives a focus indicator.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The inventory grid MUST support keyboard focus, allowing users to navigate between slots using the Up, Down, Left, and Right arrow keys.
- **FR-002**: Arrow key navigation MUST move focus one slot at a time in the pressed direction, based on the visual grid layout.
- **FR-003**: Arrow key navigation MUST stop at grid boundaries (top row, bottom row, first column, last column) with no wrap-around between the first and last rows.
- **FR-004**: Left/Right navigation MUST wrap within rows — pressing Right on the last slot in a row moves focus to the first slot of the next row; pressing Left on the first slot in a row moves focus to the last slot of the previous row.
- **FR-005**: The paper doll MUST support keyboard focus, allowing users to navigate between equipment slots using the arrow keys.
- **FR-006**: The TAB key MUST move keyboard focus from the inventory grid to the paper doll; Shift+TAB from the paper doll MUST return focus to the inventory grid.
- **FR-007**: When an inventory slot or paper doll slot has keyboard focus, the item tooltip MUST display, using the same content and presentation as the existing mouse-hover tooltip.
- **FR-008**: The tooltip MUST close when keyboard focus leaves the slot.
- **FR-009**: Pressing Space or Enter on a focused, occupied inventory slot containing an equippable item MUST equip the item to the correct paper doll slot.
- **FR-010**: Pressing Space or Enter on a focused, occupied paper doll slot MUST unequip the item and return it to the inventory.
- **FR-011**: Pressing Space or Enter on an empty slot (inventory or paper doll) MUST produce no action.
- **FR-012**: The currently focused slot in both the inventory grid and paper doll MUST have a visible focus indicator (e.g., a distinct focus ring or highlight) distinguishable from the non-focused and hover states.
- **FR-013**: When the user begins navigating the inventory grid with arrow keys, a small hint tooltip MUST appear near the paper doll informing the user they can press TAB to switch focus to the paper doll.
- **FR-014**: The TAB hint tooltip MUST dismiss when the user presses TAB to switch focus to the paper doll, and MUST NOT reappear for the remainder of that session.
- **FR-015**: The TAB hint tooltip MUST NOT appear when the user is interacting with inventory using only the mouse.

### Key Entities

- **Inventory Grid**: The grid of item slots the player owns; has a defined number of columns and rows; each slot may be occupied or empty.
- **Paper Doll**: The equipment panel displaying the character's body with dedicated slots for each equipment type (head, chest, weapon, etc.); each slot may be occupied or empty.
- **Keyboard Focus State**: The currently active slot within either the inventory grid or the paper doll; only one component holds focus at a time; tracks row and column position within the grid.
- **Item Tooltip**: The overlay panel displaying item details; triggered by both mouse hover and keyboard focus; content is identical regardless of trigger source.
- **TAB Hint Tooltip**: A small, transient notification near the paper doll; shown only once per session when keyboard navigation of the inventory grid is first detected.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A keyboard-only user can navigate to any slot in the inventory grid using only arrow keys without the pointer leaving its resting position.
- **SC-002**: A keyboard-only user can equip an item from the inventory to the paper doll and unequip it back, completing the full round-trip in under 15 key presses from a cold start.
- **SC-003**: The item tooltip for a keyboard-focused slot appears within the same visual response time as a mouse-hover tooltip (no perceptible additional delay).
- **SC-004**: The TAB hint tooltip appears on first arrow-key navigation of the inventory grid for 100% of sessions where the paper doll is visible and has not yet been tabbed to.
- **SC-005**: All keyboard navigation interactions meet WCAG 2.1 AA keyboard operability requirements — every interactive slot is reachable and operable via keyboard alone.
- **SC-006**: Equip and unequip actions triggered by keyboard produce the same inventory and character state as the equivalent drag-and-drop mouse actions.

## Assumptions

- The inventory grid has a fixed number of columns; the number of columns is known at render time and consistent across rows.
- Existing equip/unequip business logic (used by drag-and-drop) is reusable for keyboard-triggered equip and unequip actions without modification.
- The existing item tooltip infrastructure (currently triggered by mouse hover) can be invoked by keyboard focus events without requiring a separate tooltip implementation.
- Only one slot (across both the inventory grid and the paper doll) should be in the "keyboard focused" state at any given time.
- The TAB hint tooltip is a session-only hint — it does not persist across page reloads or sessions (no storage required).
- Mouse and keyboard interactions can coexist — switching from keyboard to mouse mid-session is supported and should not leave the UI in a broken focus state.
- The paper doll navigates its equipment slots in a predictable order (e.g., top-to-bottom, left-to-right by visual position) when using arrow keys.
