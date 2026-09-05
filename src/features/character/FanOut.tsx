import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Item, SlotType } from '../../types/domain';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useItemTooltip } from '../inventory/tooltip';
import { useSound } from '../audio/useSound';

/**
 * Direction from which the fan-out arcs away, based on the slot's
 * position in the paper doll layout.
 */
const SLOT_FAN_DIRECTION: Record<SlotType, number> = {
  head: -90,       // fans upward
  weapon: 180,     // fans left
  hands: 180,      // fans left
  body: 0,         // fans right
  accessory: 0,    // fans right
  legs: 90,        // fans downward-left
  feet: 90,        // fans downward-right
};

/** Distance from slot center to fanned item center (px). */
const FAN_RADIUS = 70;

/** Total arc angle (degrees) for the fan spread. */
const FAN_ARC = 120;

function computeFanPositions(
  slot: SlotType,
  count: number,
): { x: number; y: number }[] {
  const centerAngle = SLOT_FAN_DIRECTION[slot];
  if (count === 1) {
    const rad = (centerAngle * Math.PI) / 180;
    return [{ x: Math.cos(rad) * FAN_RADIUS, y: Math.sin(rad) * FAN_RADIUS }];
  }
  const halfArc = FAN_ARC / 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = centerAngle - halfArc + (i / (count - 1)) * FAN_ARC;
    const rad = (angle * Math.PI) / 180;
    return { x: Math.cos(rad) * FAN_RADIUS, y: Math.sin(rad) * FAN_RADIUS };
  });
}

const FALLBACK_ICON = '◻️';

function resolveIcon(icon: string): string {
  return icon.trim().length > 0 ? icon : FALLBACK_ICON;
}

const SLOT_LABELS: Readonly<Record<SlotType, string>> = {
  head: 'Head',
  body: 'Body',
  legs: 'Legs',
  hands: 'Hands',
  feet: 'Feet',
  weapon: 'Weapon',
  accessory: 'Accessory',
};

interface FanOutProps {
  readonly slot: SlotType;
  readonly items: readonly Item[];
  readonly onDismiss?: () => void;
}

/**
 * Radial fan-out of unequipped items for a given slot.
 * Items arc outward from the slot, animated with Framer Motion.
 * Keyboard: Arrow keys cycle focus, Home/End jump, Enter/Space equips, Escape closes, Tab dismisses.
 */
export function FanOut({ slot, items, onDismiss }: FanOutProps) {
  const tooltip = useItemTooltip();
  const play = useSound();
  const reducedMotion = useReducedMotion();
  const focusedFanoutIndex = useInventoryStore((s) => s.focusedFanoutIndex);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const positions = computeFanPositions(slot, items.length);

  // Focus the active fan-out item when index changes ONLY if focus is already inside the fan-out
  useEffect(() => {
    const hasFocusInFanout = itemRefs.current.some(
      (ref) => ref !== null && document.activeElement === ref,
    );
    if (hasFocusInFanout) {
      const el = itemRefs.current[focusedFanoutIndex];
      if (el && document.activeElement !== el) {
        el.focus();
      }
    }
  }, [focusedFanoutIndex]);

  const handleItemClick = (item: Item) => {
    const store = useInventoryStore.getState();
    store.equip(item.id, slot);
    store.setActiveFanoutSlot(null);
    store.setFeedback(`Equipped ${item.name} to ${SLOT_LABELS[slot]} slot.`);
    play('equip');
  };

  const handleItemKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const store = useInventoryStore.getState();
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp': {
        event.preventDefault();
        event.stopPropagation();
        const nextIndex = (index - 1 + items.length) % items.length;
        store.setFocusedFanoutIndex(nextIndex);
        break;
      }
      case 'ArrowRight':
      case 'ArrowDown': {
        event.preventDefault();
        event.stopPropagation();
        const nextIndex = (index + 1) % items.length;
        store.setFocusedFanoutIndex(nextIndex);
        break;
      }
      case 'Home': {
        event.preventDefault();
        event.stopPropagation();
        store.setFocusedFanoutIndex(0);
        break;
      }
      case 'End': {
        event.preventDefault();
        event.stopPropagation();
        store.setFocusedFanoutIndex(items.length - 1);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        event.stopPropagation();
        const selectedItem = items[index];
        if (selectedItem !== undefined) {
          handleItemClick(selectedItem);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        store.setActiveFanoutSlot(null);
        store.setFeedback(`Closed ${SLOT_LABELS[slot]} slot options.`);
        onDismiss?.();
        break;
      case 'Tab':
        // Close fanout cleanly on tab out
        store.setActiveFanoutSlot(null);
        break;
    }
  };

  return (
    <AnimatePresence>
      <div
        id={`fanout-listbox-${slot}`}
        role="listbox"
        aria-label={`Available items for ${SLOT_LABELS[slot]} slot`}
        aria-orientation="horizontal"
        className="pointer-events-none absolute inset-0 z-20"
      >
        {items.map((item, i) => {
          const pos = positions[i] ?? { x: 0, y: 0 };
          const isFocused = focusedFanoutIndex === i;
          const describedBy = tooltip.ariaDescribedByFor(item.id);

          return (
            <motion.div
              key={item.id}
              className="pointer-events-auto absolute left-1/2 top-1/2"
              initial={
                reducedMotion === true
                  ? false
                  : { scale: 0, opacity: 0, x: '-50%', y: '-50%' }
              }
              animate={{
                scale: 1,
                opacity: 1,
                x: `calc(-50% + ${String(pos.x)}px)`,
                y: `calc(-50% + ${String(pos.y)}px)`,
              }}
              exit={
                reducedMotion === true
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { scale: 0, opacity: 0, x: '-50%', y: '-50%' }
              }
              transition={{
                duration: reducedMotion === true ? 0 : 0.2,
                ease: 'easeOut',
              }}
            >
              <button
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                id={`fanout-item-${item.id}`}
                type="button"
                role="option"
                aria-selected={isFocused}
                aria-setsize={items.length}
                aria-posinset={i + 1}
                aria-label={`Equip ${item.name}`}
                aria-describedby={describedBy ?? undefined}
                data-testid={`fanout-item-${item.id}`}
                className={`flex h-cell w-cell items-center justify-center rounded border bg-surface-raised p-1 text-ink shadow-lg shadow-surface-sunken/60 transition-colors outline-offset-2 hover:bg-surface-raised/90 hover:border-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid ${
                  isFocused ? 'border-gold' : 'border-slot-idle/60'
                }`}
                onClick={() => {
                  handleItemClick(item);
                }}
                onKeyDown={(e) => {
                  handleItemKeyDown(e, i);
                }}
                onMouseEnter={() => {
                  tooltip.open(item, 'hover', itemRefs.current[i] ?? null);
                }}
                onMouseLeave={() => {
                  tooltip.closeFor(item.id, 'hover');
                }}
                onFocus={() => {
                  useInventoryStore.getState().setFocusedFanoutIndex(i);
                  tooltip.open(item, 'focus', itemRefs.current[i] ?? null);
                }}
                onBlur={() => {
                  tooltip.closeFor(item.id, 'focus');
                }}
                tabIndex={isFocused ? 0 : -1}
              >
                <span aria-hidden="true" className="text-2xl leading-none">
                  {resolveIcon(item.icon)}
                </span>
              </button>
            </motion.div>
          );
        })}
      </div>
    </AnimatePresence>
  );
}
