import type { SlotType } from '../../types/domain';
import { useInventoryStore } from '../../store/useInventoryStore';
import { SLOT_LABELS } from '../character/FanOut';

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

/**
 * Handles keyboard navigation across equipment slots and within fan-outs.
 * When a fan-out is active on the current slot, Arrow Left/Right navigate
 * fanned items; otherwise Arrow keys navigate between slots.
 */
export function handleEquipmentKeyDown(
  event: React.KeyboardEvent<HTMLButtonElement>,
  slot: SlotType,
  fanoutItemCount?: number,
) {
  const store = useInventoryStore.getState();

  switch (event.key) {
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight': {
      // If fan-out is active on this slot and there are items, Left/Right navigate within fan-out
      if (
        store.activeFanoutSlot === slot &&
        fanoutItemCount !== undefined &&
        fanoutItemCount > 0
      ) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          const delta = event.key === 'ArrowRight' ? 1 : -1;
          const nextIndex =
            (store.focusedFanoutIndex + delta + fanoutItemCount) % fanoutItemCount;
          store.setFocusedFanoutIndex(nextIndex);
          return;
        }
      }
      // Otherwise, navigate between slots
      event.preventDefault();
      const nextSlot = SLOT_NAV_MAP[slot][event.key];
      store.setFocusedSlot(nextSlot);
      break;
    }
    case 'Escape':
      if (store.activeFanoutSlot !== null) {
        event.preventDefault();
        const activeSlot = store.activeFanoutSlot;
        store.setActiveFanoutSlot(null);
        store.setFeedback(`Closed ${SLOT_LABELS[activeSlot]} slot options.`);
      }
      break;
  }
}
