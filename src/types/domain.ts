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
export const STAT_KEYS = ['hp', 'mp', 'def', 'str', 'agi', 'int'] as const;

export type StatKey = (typeof STAT_KEYS)[number];

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

/** Zustand-owned equipment/session state — IDs only, never entity copies. */
export interface EquipmentState {
  readonly equipped: Readonly<Record<SlotType, ItemId | null>>;
  /** Explicit set of unequipped item IDs for O(1) lookup. */
  readonly unequipped: ReadonlySet<ItemId>;
  readonly focusedSlot: SlotType | null;
  /** Which equipment slot currently has its fan-out open, if any. */
  readonly activeFanoutSlot: SlotType | null;
  /** Index of the focused item within the active fan-out (Arrow key nav). */
  readonly focusedFanoutIndex: number;
}
