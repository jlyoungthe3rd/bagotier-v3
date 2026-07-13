import type { SlotType } from '../../types/domain';
import { useInventoryStore } from '../../store/useInventoryStore';

export const SLOT_NAV_MAP: Record<
  SlotType,
  Record<'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight', SlotType>
> = {
  head: {
    ArrowUp: 'head',
    ArrowDown: 'body',
    ArrowLeft: 'weapon',
    ArrowRight: 'accessory',
  },
  weapon: {
    ArrowUp: 'head',
    ArrowDown: 'hands',
    ArrowLeft: 'weapon',
    ArrowRight: 'body',
  },
  hands: { ArrowUp: 'weapon', ArrowDown: 'legs', ArrowLeft: 'hands', ArrowRight: 'body' },
  body: {
    ArrowUp: 'head',
    ArrowDown: 'legs',
    ArrowLeft: 'weapon',
    ArrowRight: 'accessory',
  },
  accessory: {
    ArrowUp: 'head',
    ArrowDown: 'feet',
    ArrowLeft: 'body',
    ArrowRight: 'accessory',
  },
  legs: {
    ArrowUp: 'body',
    ArrowDown: 'feet',
    ArrowLeft: 'hands',
    ArrowRight: 'accessory',
  },
  feet: {
    ArrowUp: 'legs',
    ArrowDown: 'feet',
    ArrowLeft: 'hands',
    ArrowRight: 'accessory',
  },
};

export function getGridColumns(): number {
  if (typeof window !== 'undefined') {
    const matchMediaFn = (window as unknown as Record<string, unknown>).matchMedia;
    if (typeof matchMediaFn === 'function') {
      return (matchMediaFn as (query: string) => MediaQueryList)('(min-width: 640px)')
        .matches
        ? 6
        : 4;
    }
  }
  return 6;
}

export function handleBagKeyDown(
  event: React.KeyboardEvent<HTMLButtonElement>,
  index: number,
) {
  const store = useInventoryStore.getState();

  const cols = getGridColumns();
  let nextIndex = index;
  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault();
      store.triggerArrowKeyNav();
      if (index % cols < cols - 1) {
        nextIndex = index + 1;
      } else if (index < 23) {
        nextIndex = index + 1;
      }
      store.setFocusedBagIndex(nextIndex);
      break;
    case 'ArrowLeft':
      event.preventDefault();
      store.triggerArrowKeyNav();
      if (index % cols > 0) {
        nextIndex = index - 1;
      } else if (index > 0) {
        nextIndex = index - 1;
      }
      store.setFocusedBagIndex(nextIndex);
      break;
    case 'ArrowDown':
      event.preventDefault();
      store.triggerArrowKeyNav();
      if (index + cols < 24) {
        store.setFocusedBagIndex(index + cols);
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      store.triggerArrowKeyNav();
      if (index - cols >= 0) {
        store.setFocusedBagIndex(index - cols);
      }
      break;
    case 'Tab':
      if (!event.shiftKey) {
        event.preventDefault();
        store.setFocusedSection('equipment');
        store.dismissTabHint();
      }
      break;
  }
}

export function handleEquipmentKeyDown(
  event: React.KeyboardEvent<HTMLButtonElement>,
  slot: SlotType,
) {
  const store = useInventoryStore.getState();

  switch (event.key) {
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight': {
      event.preventDefault();
      const nextSlot = SLOT_NAV_MAP[slot][event.key];
      store.setFocusedSlot(nextSlot);
      break;
    }
    case 'Tab':
      if (event.shiftKey) {
        event.preventDefault();
        store.setFocusedSection('bag');
      }
      break;
  }
}
