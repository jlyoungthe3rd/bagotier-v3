# Bagotier V3: Feature Specifications

This document consolidates the core user stories, functional requirements, and success criteria for the features implemented in **Bagotier V3**.

---

## Feature 001: Game Inventory Management System

Mimics the experience of managing a character inventory in a modern RPG/video game using drag-and-drop item equipping, live stat calculations, and sound effects.

### User Stories

- **User Story 1: Equip an Item via Drag and Drop (P1)**
  A user views their generated character alongside equipment slots (head, body, legs, hands, feet, weapon, accessory) and an inventory grid. They can click/drag an item onto a matching equipment slot and release to equip it.
  - _Acceptance Criteria_:
    1. Dragging to a matching slot equips the item and removes it from the inventory grid.
    2. Dragging to a non-matching slot rejects the equip and returns the item to its origin.
    3. Hovering a compatible slot highlights it as a valid drop target.
    4. Releasing over empty space returns the item to its origin.

- **User Story 2: Character Stats Update with Equipment (P2)**
  Equipping/unequipping gear immediately updates the character's stats (HP, MP, DEF, STR) based on the item's bonuses.
  - _Acceptance Criteria_:
    1. Equipping a helmet with +5 DEF increases DEF accordingly.
    2. Unequipping it reverts DEF to the base value.
    3. Multiple items equipped combine their bonuses with the base values.
    4. Changed stats are visually highlighted to indicate the update.

- **User Story 3: Unequip an Item (P2)**
  A user drags an equipped item back to the inventory grid (or performs a swap) to unequip it.
  - _Acceptance Criteria_:
    1. Dragging from slot to inventory grid unequips the item.
    2. Dropping a compatible item onto an occupied slot swaps the items.
    3. Unequipping into a full inventory is blocked.

- **User Story 4: Sound Effects for Main Interactions (P3)**
  Tactile game sounds play for pickup, successful equip, and unequip, governed by a mute toggle.
  - _Acceptance Criteria_:
    1. Pickup, equip, and unequip play distinct sounds once.
    2. No sounds play when muted.

- **User Story 5: Generated Character Presentation (P3)**
  A generated character is displayed as the visual centerpiece, with equipment slots arranged around corresponding body locations.

### Functional Requirements

- **FR-001**: Display character, equipment slots, stat panel, and inventory grid.
- **FR-002**: Support drag-and-drop actions for inventory items.
- **FR-003**: Enforce matching slot types between items and equipment slots.
- **FR-004**: Define slot types and positive/negative stat modifiers for each item.
- **FR-005**: Highlight valid drop targets during drag.
- **FR-006**: Update character stats (HP, MP, DEF, STR) dynamically as `base + Σ modifiers`.
- **FR-007**: Support unequipping items back into the inventory grid.
- **FR-008**: Support item swapping on occupied slots.
- **FR-009**: Play distinct sound effects for pickup, equip, and unequip.
- **FR-010**: Provide a user control to mute/unmute sounds.
- **FR-011**: Prevent stat inconsistencies during rapid interactions (no double-counting).
- **FR-012**: Cancel drag on invalid target drop or interruption.
- **FR-013**: Include a starting catalog of ≥ 10 items covering all slot types.
- **FR-014**: Show effective stats and make base vs. modifier contribution inspectable.

---

## Feature 002: Item Hover Tooltip

Displays a viewport-aware tooltip window when hovering over items to view their details.

### User Stories

- **User Story 1: View Item Details on Hover (P1)**
  Hovering an item displays a tooltip with key item information; moving the pointer away closes it.

- **User Story 2: Avoid Tooltip Obstruction (P2)**
  Tooltips are positioned so they do not block the hovered item and remain fully visible within the viewport.
  - _Acceptance Criteria_:
    1. Repositions to stay on screen near viewport boundaries.
    2. Does not fully cover the hovered item itself.

- **User Story 3: Stable Tooltip Behavior (P3)**
  Predictable behavior when moving quickly between items; old tooltips close and new ones open without overlap.

### Functional Requirements

- **FR-001**: Display tooltip on hover for items with tooltip data.
- **FR-002**: Show correct item data in the tooltip.
- **FR-003**: Hide tooltip when pointer leaves the item.
- **FR-004**: Enforce a single-tooltip-at-a-time rule.
- **FR-005**: Reposition tooltip to prevent clipping at viewport edges.
- **FR-006**: Ensure tooltips do not block interaction with other page elements.
- **FR-007**: Do not show empty tooltips if an item has no description.

---

## Feature 003: Icon-Only Inventory Slots

Clutter-free inventory slots showing only item icons instead of text labels.

### User Stories

- **User Story 1: Clean Inventory Grid (P1)**
  Slots display only the item icon to make the grid clean and readable.

- **User Story 2: Clear Slot States (P2)**
  Empty and locked/unavailable slots remain clearly distinguishable even without text inside them.
  - _Acceptance Criteria_:
    1. Mix of empty and occupied slots is obvious.
    2. Invalid/missing icon data renders a fallback visual state rather than showing text.

### Functional Requirements

- **FR-001**: Remove item name text from inside all inventory grid slots.
- **FR-002**: Display only the item icon in occupied slots.
- **FR-003**: Keep empty and unavailable slot states visually distinguishable.
- **FR-004**: Retain metadata for use in tooltips/other UI elements.
- **FR-005**: Render a non-text fallback when an item icon cannot be displayed.

---

## Feature 004: Keyboard Inventory Navigation

Accessibility enhancement allowing users to navigate and interact with the inventory grid and equipment slots using a keyboard.

### User Stories

- **User Story 1: Navigate Inventory Grid with Arrow Keys (P1)**
  Move focus through the inventory grid using Up, Down, Left, and Right arrow keys.
  - _Acceptance Criteria_:
    1. Arrow keys move focus one slot at a time.
    2. Focus wraps between rows (Right at row-end wraps to next row-start; Left at row-start wraps to previous row-end).
    3. Focus stops at grid boundaries (Up on top row or Down on bottom row does not wrap).

- **User Story 2: Tooltip Parity (P2)**
  Moving keyboard focus to a slot displays the same item tooltip that mouse-hover produces.

- **User Story 3: Keyboard Equip/Unequip Confirmation (P2)**
  Pressing Space or Enter on a focused inventory item equips it, and pressing Space or Enter on an equipped slot unequips it.

- **User Story 4: Switch Contexts with TAB (P3)**
  Pressing TAB switches focus between the inventory grid and the paper doll slots; Shift+TAB returns focus. Focus is shown via a distinct focus ring.

- **User Story 5: TAB Navigation Hint (P3)**
  Show a temporary hint tooltip near the paper doll on the first keyboard navigation attempt informing the user they can press TAB to switch panels. Dismisses when TAB is pressed.

### Functional Requirements

- **FR-001**: Support keyboard focus and arrow-key navigation in the inventory grid.
- **FR-002**: Move focus by one slot per arrow key press.
- **FR-003**: Prevent vertical wrap-around at top and bottom boundaries.
- **FR-004**: Support horizontal row wrap-around.
- **FR-005**: Support arrow-key focus navigation between paper doll equipment slots.
- **FR-006**: Support TAB/Shift+TAB context switching between panels.
- **FR-007**: Show the item tooltip on keyboard focus.
- **FR-008**: Close tooltip when focus leaves.
- **FR-009**: Equip items on Space/Enter in inventory.
- **FR-010**: Unequip items on Space/Enter on paper doll slots.
- **FR-011**: Space/Enter on empty slots does nothing.
- **FR-012**: Render a distinct visual focus indicator on active slots.
- **FR-013**: Display a temporary TAB hint tooltip near the paper doll when arrow-key navigation begins.
- **FR-014**: Dismiss the TAB hint upon tab context switch; do not show it again in the session.
- **FR-015**: Do not display the TAB hint for pure mouse users.
