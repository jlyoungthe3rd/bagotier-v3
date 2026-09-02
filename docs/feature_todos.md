# Feature TODOs & Backlog

This document tracks planned patches, UI enhancements, and feature ideas for **Bagotier V3**.

---

## 🛠️ Item Modifiers & Stats Patches

- [x] **Remove Negative Modifiers from Items**
  - Adjust item definitions and stat logic so items only confer positive/neutral modifiers.

- [x] **Stat Change Highlight & Revert Animation**
  - Remove persistent state color changes when a stat is affected by a modifier.
  - Instead, perform a brief color change and "grow" animation upon change, then revert the stat display back to default white.

---

## 🎨 UI & Layout Enhancements

- [x] **Update UI (Step 1): Central Paper Doll & Column Layout**
  - Make the paper doll central.
  - Move the bag to the bottom of the UI.
  - Use a column layout.

- [ ] **Update UI (Step 2): Cell-Based Equipment Inspector (Destiny 2 Style)**
  - Instead of clicking items to place them onto the character, show potential items when an equipment cell is selected (or mouseOvered).
  - Mimic the inventory interaction style in the video game Destiny 2.
