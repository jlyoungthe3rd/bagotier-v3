import { create } from 'zustand';
import type { EquipmentState, ItemId, SlotType } from '../types/domain';
import { SLOT_TYPES } from '../types/domain';

/**
 * Slot-type registry used only to validate equip/swap compatibility
 * (invariant I2). Holds primitive slot names keyed by ID — never Item
 * entities (invariant I5). Registered from React Query data at load.
 */
let slotTypeIndex: Readonly<Record<string, SlotType>> = {};

/** Registers the ID → slotType mapping used for compatibility checks. */
export function registerItemSlotTypes(index: Readonly<Record<string, SlotType>>): void {
  slotTypeIndex = index;
}

function slotTypeOf(itemId: ItemId): SlotType | undefined {
  return slotTypeIndex[itemId];
}

function emptyEquipped(): Record<SlotType, ItemId | null> {
  return Object.fromEntries(SLOT_TYPES.map((s) => [s, null])) as Record<
    SlotType,
    ItemId | null
  >;
}

function initialState(): EquipmentState {
  return {
    equipped: emptyEquipped(),
    unequipped: new Set<ItemId>(),
    muted: false,
    feedback: null,
    focusedSection: null,
    focusedSlot: 'head',
    activeFanoutSlot: null,
    focusedFanoutIndex: 0,
  };
}

/* ------------------------------------------------------------------ *
 * Pure transitions — `(state, args) → state`, unit-tested directly.  *
 * ------------------------------------------------------------------ */

/**
 * Equips an item from the unequipped set into a type-matching slot.
 * If the slot is already occupied, the displaced item is returned to the unequipped set.
 */
export function equipTransition(
  state: EquipmentState,
  itemId: ItemId,
  slot: SlotType,
): EquipmentState {
  if (!state.unequipped.has(itemId)) return state; // item not available
  if (slotTypeOf(itemId) !== slot) return state; // I2: type mismatch no-ops

  const nextUnequipped = new Set(state.unequipped);
  nextUnequipped.delete(itemId);

  // If slot is occupied, displace the current item back to unequipped
  const displaced = state.equipped[slot];
  if (displaced !== null) {
    nextUnequipped.add(displaced);
  }

  return {
    ...state,
    unequipped: nextUnequipped,
    equipped: { ...state.equipped, [slot]: itemId },
  };
}

/** Unequips a slot, moving the item back to the unequipped set. */
export function unequipTransition(
  state: EquipmentState,
  slot: SlotType,
): EquipmentState {
  const itemId = state.equipped[slot];
  if (itemId === null) return state; // no-op

  const nextUnequipped = new Set(state.unequipped);
  nextUnequipped.add(itemId);

  return {
    ...state,
    unequipped: nextUnequipped,
    equipped: { ...state.equipped, [slot]: null },
  };
}

/* ------------------------------------------------------------------ *
 * Store                                                               *
 * ------------------------------------------------------------------ */

export interface InventoryStore extends EquipmentState {
  /** Places all catalog IDs into the unequipped set (initial load). */
  seedUnequipped: (itemIds: readonly ItemId[]) => void;
  equip: (itemId: ItemId, slot: SlotType) => void;
  unequip: (slot: SlotType) => void;
  toggleMute: () => void;
  setFeedback: (feedback: string | null) => void;
  dismissFeedback: () => void;
  setFocusedSection: (section: 'equipment' | null) => void;
  setFocusedSlot: (slot: SlotType) => void;
  setActiveFanoutSlot: (slot: SlotType | null) => void;
  setFocusedFanoutIndex: (index: number) => void;
  /** Restores the pristine initial state (tests + reload). */
  reset: () => void;
}

export const useInventoryStore = create<InventoryStore>()((set, get) => ({
  ...initialState(),
  seedUnequipped: (itemIds) =>
    set(() => ({
      ...initialState(),
      unequipped: new Set(itemIds),
      muted: get().muted,
    })),
  equip: (itemId, slot) => set((s) => ({ ...equipTransition(s, itemId, slot) })),
  unequip: (slot) => set((s) => ({ ...unequipTransition(s, slot) })),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setFeedback: (msg) => set({ feedback: msg }),
  dismissFeedback: () => set({ feedback: null }),
  setFocusedSection: (section) => set({ focusedSection: section }),
  setFocusedSlot: (slot) => set({ focusedSlot: slot }),
  setActiveFanoutSlot: (slot) => set({ activeFanoutSlot: slot, focusedFanoutIndex: 0 }),
  setFocusedFanoutIndex: (index) => set({ focusedFanoutIndex: index }),
  reset: () => set(initialState()),
}));
