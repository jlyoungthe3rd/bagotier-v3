import type { Item } from '../types/domain';
import { toItemId } from '../types/domain';

/**
 * Seed item catalog: 14 items covering every SlotType, with a mix of
 * positive, negative, and absent modifiers (FR-004, FR-013).
 */
export const items: readonly Item[] = [
  {
    id: toItemId('iron-helm'),
    name: 'Iron Helm',
    icon: '🪖',
    slotType: 'head',
    modifiers: { def: 5 },
  },
  {
    id: toItemId('wizard-hat'),
    name: 'Wizard Hat',
    icon: '🎩',
    slotType: 'head',
    modifiers: { mp: 8, int: 4 },
  },
  {
    id: toItemId('steel-cuirass'),
    name: 'Steel Cuirass',
    icon: '🦺',
    slotType: 'body',
    modifiers: { def: 9, hp: 4 },
  },
  {
    id: toItemId('silk-robe'),
    name: 'Silk Robe',
    icon: '🥋',
    slotType: 'body',
    modifiers: { mp: 6, int: 5 },
  },
  {
    id: toItemId('plated-greaves'),
    name: 'Plated Greaves',
    icon: '🦵',
    slotType: 'legs',
    modifiers: { def: 4 },
  },
  {
    id: toItemId('swift-trousers'),
    name: 'Swift Trousers',
    icon: '👖',
    slotType: 'legs',
    modifiers: { hp: 2, str: 1, agi: 4 },
  },
  {
    id: toItemId('leather-gloves'),
    name: 'Leather Gloves',
    icon: '🧤',
    slotType: 'hands',
    modifiers: { str: 2 },
  },
  {
    id: toItemId('cursed-gauntlets'),
    name: 'Cursed Gauntlets',
    icon: '🦾',
    slotType: 'hands',
    modifiers: { str: 7 },
  },
  {
    id: toItemId('travel-boots'),
    name: 'Travel Boots',
    icon: '🥾',
    slotType: 'feet',
    modifiers: { hp: 3, agi: 3 },
  },
  {
    id: toItemId('iron-sabatons'),
    name: 'Iron Sabatons',
    icon: '👢',
    slotType: 'feet',
    modifiers: { def: 3 },
  },
  {
    id: toItemId('bronze-sword'),
    name: 'Bronze Sword',
    icon: '🗡️',
    slotType: 'weapon',
    modifiers: { str: 6 },
  },
  {
    id: toItemId('oak-staff'),
    name: 'Oak Staff',
    icon: '🪄',
    slotType: 'weapon',
    modifiers: { mp: 10, int: 6 },
  },
  {
    id: toItemId('lucky-charm'),
    name: 'Lucky Charm',
    icon: '🍀',
    slotType: 'accessory',
    modifiers: { agi: 2, int: 2 },
  },
  {
    id: toItemId('ruby-ring'),
    name: 'Ruby Ring',
    icon: '💍',
    slotType: 'accessory',
    modifiers: { hp: 5, mp: 5 },
  },
];
