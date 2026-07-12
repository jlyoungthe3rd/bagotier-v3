/**
 * Core domain types for the inventory feature (see specs/001-game-inventory-system).
 * Zod schemas in `./schemas.ts` validate data at the mock/query boundary.
 */

declare const itemIdBrand: unique symbol;

/** Branded string identifier for an {@link Item}. */
export type ItemId = string & { readonly [itemIdBrand]: true };

/** Creates an {@link ItemId} from a raw string (mock/data layer only). */
export function toItemId(raw: string): ItemId {
  return raw as ItemId;
}

/** The seven fixed equipment slot types. */
export const SLOT_TYPES = [
  'head',
  'body',
  'legs',
  'hands',
  'feet',
  'weapon',
  'accessory',
] as const;

export type SlotType = (typeof SLOT_TYPES)[number];

/** Stat keys shown in the stat panel (v1 minimum set). */
export const STAT_KEYS = ['hp', 'mp', 'def', 'str'] as const;

export type StatKey = (typeof STAT_KEYS)[number];

/** Fixed inventory bag size (invariant I3). */
export const BAG_CAPACITY = 24;

/** An equippable item from the catalog (React Query owned, immutable). */
export interface Item {
  readonly id: ItemId;
  readonly name: string;
  readonly icon: string;
  readonly slotType: SlotType;
  /** Integer stat modifiers; positive, negative, or absent per stat. */
  readonly modifiers: Partial<Record<StatKey, number>>;
}

/** Seed/part identifiers for the generated character visual. */
export interface CharacterAppearance {
  readonly seed: number;
  readonly parts: Readonly<Record<string, string>>;
}

/** The generated player character (React Query owned). */
export interface Character {
  readonly id: string;
  readonly name: string;
  readonly appearance: CharacterAppearance;
  readonly baseStats: Readonly<Record<StatKey, number>>;
}

/** Where a drag started (bag cell or equipment slot). */
export type DragOrigin =
  | { readonly kind: 'bag'; readonly index: number }
  | { readonly kind: 'slot'; readonly slot: SlotType };

/** Zustand-owned equipment/session state — IDs only, never entity copies. */
export interface EquipmentState {
  readonly equipped: Readonly<Record<SlotType, ItemId | null>>;
  readonly bag: readonly (ItemId | null)[];
  readonly muted: boolean;
  readonly activeDrag: { readonly itemId: ItemId; readonly origin: DragOrigin } | null;
}

/**
 * The single value resolved per drag-end; triggers exactly one store
 * transition and at most one sound effect (SC-004).
 */
export type DropOutcome =
  | { readonly type: 'equip'; readonly itemId: ItemId; readonly slot: SlotType }
  | {
      readonly type: 'swap';
      readonly itemId: ItemId;
      readonly slot: SlotType;
      readonly replacedItemId: ItemId;
    }
  | { readonly type: 'unequip'; readonly slot: SlotType; readonly toBagIndex?: number }
  | { readonly type: 'moveInBag'; readonly itemId: ItemId; readonly toBagIndex: number }
  | { readonly type: 'invalid' }
  | { readonly type: 'cancelled' };
