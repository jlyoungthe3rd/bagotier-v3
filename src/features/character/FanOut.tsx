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

interface FanOutProps {
  readonly slot: SlotType;
  readonly items: readonly Item[];
}

/**
 * Radial fan-out of unequipped items for a given slot.
 * Items arc outward from the slot, animated with Framer Motion.
 * Keyboard: Arrow Left/Right cycle focus, Enter/Space equips, Escape closes.
 */
export function FanOut({ slot, items }: FanOutProps) {
  const tooltip = useItemTooltip();
  const play = useSound();
  const reducedMotion = useReducedMotion();
  const focusedFanoutIndex = useInventoryStore((s) => s.focusedFanoutIndex);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const positions = computeFanPositions(slot, items.length);

  // Focus the active fan-out item when index changes
  useEffect(() => {
    const el = itemRefs.current[focusedFanoutIndex];
    if (el && document.activeElement !== el) {
      el.focus();
    }
  }, [focusedFanoutIndex]);

  const handleItemClick = (item: Item) => {
    const store = useInventoryStore.getState();
    store.equip(item.id, slot);
    store.setActiveFanoutSlot(null);
    play('equip');
  };

  const handleItemKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const store = useInventoryStore.getState();
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight': {
        event.preventDefault();
        event.stopPropagation();
        const delta = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (index + delta + items.length) % items.length;
        store.setFocusedFanoutIndex(nextIndex);
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
        break;
    }
  };

  return (
    <AnimatePresence>
      <div
        role="listbox"
        aria-label={`Available items for ${slot} slot`}
        className="pointer-events-none absolute inset-0 z-20"
      >
        {items.map((item, i) => {
          const pos = positions[i] ?? { x: 0, y: 0 };
          const isFocused = focusedFanoutIndex === i;

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
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <button
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="option"
                aria-selected={isFocused}
                aria-label={`Equip ${item.name}`}
                data-testid={`fanout-item-${item.id}`}
                className={`flex h-cell w-cell items-center justify-center rounded border bg-surface-raised p-1 text-ink shadow-lg shadow-surface-sunken/60 transition-colors outline-offset-2 hover:bg-surface-raised/90 hover:border-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid ${
                  isFocused ? 'border-gold' : 'border-slot-idle/60'
                }`}
                onClick={() => { handleItemClick(item); }}
                onKeyDown={(e) => { handleItemKeyDown(e, i); }}
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
                aria-describedby={tooltip.ariaDescribedByFor(item.id) ?? undefined}
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
