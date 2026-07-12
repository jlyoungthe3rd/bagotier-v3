import { create } from 'zustand';
import type {
  DragOrigin,
  EquipmentState,
  ItemId,
  SlotType,
} from '../types/domain';
import { BAG_CAPACITY, SLOT_TYPES } from '../types/domain';

/** Result of an `unequip` attempt (US3-AS3 full-bag rejection). */
export type UnequipResult = 'ok' | 'bag-full' | 'no-op';

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
    bag: Array.from({ length: BAG_CAPACITY }, () => null),
    muted: false,
    activeDrag: null,
  };
}

/* ------------------------------------------------------------------ *
 * Pure transitions — `(state, args) → state`, unit-tested directly.  *
 * ------------------------------------------------------------------ */

/** Moves an item ID from its bag cell into an empty, type-matching slot. */
export function equipTransition(
  state: EquipmentState,
  itemId: ItemId,
  slot: SlotType,
): EquipmentState {
  const bagIndex = state.bag.indexOf(itemId);
  if (bagIndex === -1) return state; // item not in bag
  if (state.equipped[slot] !== null) return state; // slot occupied → use swap
  if (slotTypeOf(itemId) !== slot) return state; // I2: type mismatch no-ops
  const bag = state.bag.slice();
  bag[bagIndex] = null;
  return { ...state, bag, equipped: { ...state.equipped, [slot]: itemId } };
}

/** Equips an incoming bag item into an occupied slot, displacing the current item into the incoming item's bag cell (FR-008). */
export function swapTransition(
  state: EquipmentState,
  itemId: ItemId,
  slot: SlotType,
): EquipmentState {
  const bagIndex = state.bag.indexOf(itemId);
  const displaced = state.equipped[slot];
  if (bagIndex === -1 || displaced === null) return state;
  if (slotTypeOf(itemId) !== slot) return state; // I2
  const bag = state.bag.slice();
  bag[bagIndex] = displaced;
  return { ...state, bag, equipped: { ...state.equipped, [slot]: itemId } };
}

/** Unequips a slot into the targeted (or first free) bag cell; rejects when the bag is full (I3). */
export function unequipTransition(
  state: EquipmentState,
  slot: SlotType,
  toBagIndex?: number,
): { state: EquipmentState; result: UnequipResult } {
  const itemId = state.equipped[slot];
  if (itemId === null) return { state, result: 'no-op' };
  const target =
    toBagIndex !== undefined &&
    toBagIndex >= 0 &&
    toBagIndex < BAG_CAPACITY &&
    state.bag[toBagIndex] === null
      ? toBagIndex
      : state.bag.indexOf(null);
  if (target === -1) return { state, result: 'bag-full' };
  const bag = state.bag.slice();
  bag[target] = itemId;
  return {
    state: { ...state, bag, equipped: { ...state.equipped, [slot]: null } },
    result: 'ok',
  };
}

/** Reorders an item to an empty cell within the bag. */
export function moveInBagTransition(
  state: EquipmentState,
  itemId: ItemId,
  toIndex: number,
): EquipmentState {
  const from = state.bag.indexOf(itemId);
  if (from === -1 || toIndex < 0 || toIndex >= BAG_CAPACITY) return state;
  if (state.bag[toIndex] !== null || from === toIndex) return state;
  const bag = state.bag.slice();
  bag[from] = null;
  bag[toIndex] = itemId;
  return { ...state, bag };
}

/* ------------------------------------------------------------------ *
 * Store                                                               *
 * ------------------------------------------------------------------ */

export interface InventoryStore extends EquipmentState {
  /** Places catalog IDs into the first bag cells (initial load). */
  seedBag: (itemIds: readonly ItemId[]) => void;
  startDrag: (itemId: ItemId, origin: DragOrigin) => void;
  equip: (itemId: ItemId, slot: SlotType) => void;
  swap: (itemId: ItemId, slot: SlotType) => void;
  unequip: (slot: SlotType, toBagIndex?: number) => UnequipResult;
  moveInBag: (itemId: ItemId, toIndex: number) => void;
  cancelDrag: () => void;
  toggleMute: () => void;
  /** Restores the pristine initial state (tests + reload). */
  reset: () => void;
}

export const useInventoryStore = create<InventoryStore>()((set, get) => ({
  ...initialState(),
  seedBag: (itemIds) =>
    set(() => {
      const bag: (ItemId | null)[] = Array.from({ length: BAG_CAPACITY }, () => null);
      itemIds.slice(0, BAG_CAPACITY).forEach((id, i) => {
        bag[i] = id;
      });
      return { ...initialState(), bag, muted: get().muted };
    }),
  startDrag: (itemId, origin) => set({ activeDrag: { itemId, origin } }),
  equip: (itemId, slot) =>
    set((s) => ({ ...equipTransition(s, itemId, slot), activeDrag: null })),
  swap: (itemId, slot) =>
    set((s) => ({ ...swapTransition(s, itemId, slot), activeDrag: null })),
  unequip: (slot, toBagIndex) => {
    const { state, result } = unequipTransition(get(), slot, toBagIndex);
    set({ ...state, activeDrag: null });
    return result;
  },
  moveInBag: (itemId, toIndex) =>
    set((s) => ({ ...moveInBagTransition(s, itemId, toIndex), activeDrag: null })),
  cancelDrag: () => set({ activeDrag: null }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  reset: () => set(initialState()),
}));
