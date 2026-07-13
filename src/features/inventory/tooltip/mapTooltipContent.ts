import type { Item, StatKey } from '../../../types/domain';

const SLOT_LABELS: Readonly<Record<Item['slotType'], string>> = {
  head: 'Head',
  body: 'Body',
  legs: 'Legs',
  hands: 'Hands',
  feet: 'Feet',
  weapon: 'Weapon',
  accessory: 'Accessory',
};

const STAT_LABELS: Readonly<Record<StatKey, string>> = {
  hp: 'HP',
  mp: 'MP',
  def: 'DEF',
  str: 'STR',
  agi: 'AGI',
  int: 'INT',
};

const STAT_ORDER: readonly StatKey[] = ['hp', 'mp', 'def', 'str', 'agi', 'int'];

export interface TooltipContent {
  readonly title: string;
  readonly subtitle?: string;
  readonly metadataLines: readonly string[];
  readonly isEmpty: boolean;
}

function toMetadataLine(stat: StatKey, value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${STAT_LABELS[stat]} ${prefix}${String(value)}`;
}

export function mapTooltipContent(item: Item | null | undefined): TooltipContent {
  if (item == null) {
    return { title: '', metadataLines: [], isEmpty: true };
  }

  const title = item.name.trim();
  const subtitle = SLOT_LABELS[item.slotType];
  const metadataLines = STAT_ORDER.flatMap((stat) => {
    const value = item.modifiers[stat];
    return typeof value === 'number' && Number.isFinite(value)
      ? [toMetadataLine(stat, value)]
      : [];
  });

  const isEmpty = title.length === 0;

  return {
    title,
    subtitle,
    metadataLines,
    isEmpty,
  };
}
