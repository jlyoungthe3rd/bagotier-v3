import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { DragOrigin, DropOutcome, ItemId, SlotType } from '../../types/domain';
import { useInventoryStore } from '../../store/useInventoryStore';
import { preloadSounds, useSound } from '../audio/useSound';
import { logDropTiming } from '../../lib/devLog';

/** Drag payload attached to every draggable item tile. */
interface DragData {
  readonly itemId: ItemId;
  readonly slotType: SlotType;
  readonly origin: DragOrigin;
}

/** Drop-target payload attached to every droppable (slot or bag cell). */
type DropData =
  | { readonly kind: 'slot'; readonly slot: SlotType }
  | { readonly kind: 'cell'; readonly index: number };

/** Signal for the brief invalid-drop flash animation on a slot. */
export interface InvalidFlash {
  readonly slot: SlotType;
  readonly nonce: number;
}

const InvalidFlashContext = createContext<InvalidFlash | null>(null);

export const InvalidFlashProvider = InvalidFlashContext.Provider;

/** The slot that most recently rejected a drop (drives the shake animation). */
export function useInvalidFlash(): InvalidFlash | null {
  return useContext(InvalidFlashContext);
}

/**
 * Resolves a drag-end into the single {@link DropOutcome} that drives both
 * the store transition and the sound effect (exactly-once, SC-004).
 * Pure: state in, outcome out.
 */
export function resolveDropOutcome(
  drag: DragData,
  drop: DropData | null,
  equipped: Readonly<Record<SlotType, ItemId | null>>,
): DropOutcome {
  if (drop === null) return { type: 'cancelled' };

  if (drop.kind === 'slot') {
    if (drag.origin.kind === 'slot' && drag.origin.slot === drop.slot) {
      return { type: 'cancelled' }; // dropped back onto its own slot
    }
    if (drag.slotType !== drop.slot || drag.origin.kind !== 'bag') {
      return { type: 'invalid' };
    }
    const occupant = equipped[drop.slot];
    return occupant === null
      ? { type: 'equip', itemId: drag.itemId, slot: drop.slot }
      : { type: 'swap', itemId: drag.itemId, slot: drop.slot, replacedItemId: occupant };
  }

  // Dropped on a bag cell.
  if (drag.origin.kind === 'slot') {
    return { type: 'unequip', slot: drag.origin.slot, toBagIndex: drop.index };
  }
  if (drag.origin.index === drop.index) return { type: 'cancelled' };
  return { type: 'moveInBag', itemId: drag.itemId, toBagIndex: drop.index };
}

export interface InventoryDnd {
  readonly onDragStart: (event: DragStartEvent) => void;
  readonly onDragEnd: (event: DragEndEvent) => void;
  readonly onDragCancel: () => void;
  readonly invalidFlash: InvalidFlash | null;
  readonly feedback: string | null;
  readonly dismissFeedback: () => void;
}

export interface InventoryDndCallbacks {
  /** Invoked exactly once per interaction event (used for sounds, timing). */
  readonly onPickup?: () => void;
  readonly onOutcome?: (outcome: DropOutcome) => void;
}

/**
 * DndContext handler wiring: each drag-end resolves exactly one
 * {@link DropOutcome} and dispatches exactly one store action
 * (research.md R4, FR-003/FR-012).
 */
export function useInventoryDnd(callbacks?: InventoryDndCallbacks): InventoryDnd {
  const [invalidFlash, setInvalidFlash] = useState<InvalidFlash | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const play = useSound();
  const { onPickup, onOutcome } = callbacks ?? {};

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current as DragData | undefined;
      if (data === undefined) return;
      void preloadSounds(); // first user gesture → safe to create AudioContext
      useInventoryStore.getState().startDrag(data.itemId, data.origin);
      play('pickup');
      onPickup?.();
    },
    [onPickup, play],
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const store = useInventoryStore.getState();
      const drag = event.active.data.current as DragData | undefined;
      if (drag === undefined) {
        store.cancelDrag();
        return;
      }
      const drop = (event.over?.data.current ?? null) as DropData | null;
      const dropStart = performance.now();
      const outcome = resolveDropOutcome(drag, drop, store.equipped);

      // The single sound + transition dispatch point per interaction (SC-004).
      switch (outcome.type) {
        case 'equip':
          store.equip(outcome.itemId, outcome.slot);
          play('equip');
          break;
        case 'swap':
          store.swap(outcome.itemId, outcome.slot);
          play('equip');
          break;
        case 'unequip': {
          const result = store.unequip(outcome.slot, outcome.toBagIndex);
          if (result === 'bag-full') {
            setFeedback('Your bag is full — free a cell before unequipping.');
            play('invalid');
          } else {
            play('unequip');
          }
          break;
        }
        case 'moveInBag':
          store.moveInBag(outcome.itemId, outcome.toBagIndex);
          break;
        case 'invalid':
          store.cancelDrag();
          play('invalid');
          if (drop?.kind === 'slot') {
            setInvalidFlash((prev) => ({ slot: drop.slot, nonce: (prev?.nonce ?? 0) + 1 }));
          }
          break;
        case 'cancelled':
          store.cancelDrag();
          play('invalid');
          break;
      }
      logDropTiming(outcome.type, dropStart);
      onOutcome?.(outcome);
    },
    [onOutcome, play],
  );

  const onDragCancel = useCallback(() => {
    useInventoryStore.getState().cancelDrag();
    play('invalid');
    onOutcome?.({ type: 'cancelled' });
  }, [onOutcome, play]);

  const dismissFeedback = useCallback(() => setFeedback(null), []);

  return useMemo(
    () => ({
      onDragStart,
      onDragEnd,
      onDragCancel,
      invalidFlash,
      feedback,
      dismissFeedback,
    }),
    [onDragStart, onDragEnd, onDragCancel, invalidFlash, feedback, dismissFeedback],
  );
}
