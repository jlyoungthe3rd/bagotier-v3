import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Item, SlotType } from '../../types/domain';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useItemTooltip } from '../inventory/tooltip';
import { useSound } from '../audio/useSound';

/**
 * Direction from which the fan-out arcs away, based on the slot's
 * position in the paper doll layout.
 *
 * Designed to project outward into empty space around the paper doll:
 * - Head fans upward to frame the character title.
 * - Weapon and hands fan outward to the left (angled into open diagonals).
 * - Body and accessory fan outward to the right (angled into open diagonals).
 * - Legs and feet fan outward away from each other into lower flanks.
 */
export const SLOT_FAN_DIRECTION: Readonly<Record<SlotType, number>> = {
  head: -90, // fans upward
  weapon: 165, // fans upward-left into open diagonal
  hands: 195, // fans downward-left into open flank
  body: 15, // fans upward-right into open diagonal
  accessory: 345, // fans downward-right into open flank
  legs: 120, // fans downward-left away from feet
  feet: 60, // fans downward-right away from legs
};

/** Distance from slot center to fanned item center (px) for desktop/tablet. */
export const FAN_RADIUS_DESKTOP = 68;

/** Distance from slot center to fanned item center (px) for mobile. */
export const FAN_RADIUS_MOBILE = 54;

/** Total arc angle (degrees) for the fan spread when 2 items are available. */
export const FAN_ARC = 80;

export function computeFanPositions(
  slot: SlotType,
  count: number,
  radius: number = FAN_RADIUS_DESKTOP,
): { x: number; y: number }[] {
  const centerAngle = SLOT_FAN_DIRECTION[slot];
  if (count <= 1) {
    const rad = (centerAngle * Math.PI) / 180;
    return [
      { x: Math.round(Math.cos(rad) * radius), y: Math.round(Math.sin(rad) * radius) },
    ];
  }
  const arc = count === 2 ? FAN_ARC : Math.min(110, 30 * (count - 1));
  const halfArc = arc / 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = centerAngle - halfArc + (i / (count - 1)) * arc;
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.round(Math.cos(rad) * radius),
      y: Math.round(Math.sin(rad) * radius),
    };
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
 * Features viewport bounding to ensure items never clip or cause overflow.
 * Keyboard: Arrow keys cycle focus, Home/End jump, Enter/Space equips, Escape closes, Tab dismisses.
 */
export function FanOut({ slot, items, onDismiss }: FanOutProps) {
  const tooltip = useItemTooltip();
  const play = useSound();
  const reducedMotion = useReducedMotion();
  const focusedFanoutIndex = useInventoryStore((s) => s.focusedFanoutIndex);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Responsive radius detection (compact for mobile < 640px)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const radius = isMobile ? FAN_RADIUS_MOBILE : FAN_RADIUS_DESKTOP;
  const basePositions = useMemo(
    () => computeFanPositions(slot, items.length, radius),
    [slot, items.length, radius],
  );

  const [positions, setPositions] = useState<{ x: number; y: number }[]>(basePositions);

  // Viewport bounds clamping: ensure no fanned item clips or overflows viewport edges
  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) {
      setPositions(basePositions);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    // In headless test environments or hidden containers, rect dimensions may be 0
    if (rect.width === 0 && rect.height === 0) {
      setPositions(basePositions);
      return;
    }

    const slotCenterX = rect.left + rect.width / 2;
    const slotCenterY = rect.top + rect.height / 2;
    const itemHalfSize = isMobile ? 22 : 28;
    const margin = 12; // Safety margin from viewport edge (px)

    const clamped = basePositions.map((pos) => {
      let { x, y } = pos;
      const itemLeft = slotCenterX + x - itemHalfSize;
      const itemRight = slotCenterX + x + itemHalfSize;
      const itemTop = slotCenterY + y - itemHalfSize;
      const itemBottom = slotCenterY + y + itemHalfSize;

      if (itemLeft < margin) {
        x += margin - itemLeft;
      } else if (itemRight > window.innerWidth - margin) {
        x -= itemRight - (window.innerWidth - margin);
      }

      if (itemTop < margin) {
        y += margin - itemTop;
      } else if (itemBottom > window.innerHeight - margin) {
        y -= itemBottom - (window.innerHeight - margin);
      }

      return { x: Math.round(x), y: Math.round(y) };
    });

    setPositions(clamped);
  }, [basePositions, isMobile]);

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
        ref={containerRef}
        id={`fanout-listbox-${slot}`}
        role="listbox"
        aria-label={`Available items for ${SLOT_LABELS[slot]} slot`}
        aria-orientation="horizontal"
        className="pointer-events-none absolute inset-0 z-30"
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
                className={`group relative flex h-11 w-11 sm:h-cell sm:w-cell items-center justify-center rounded border bg-surface-raised/95 backdrop-blur-md p-1 text-ink shadow-lg shadow-surface-sunken/80 transition-all duration-200 ease-out outline-offset-2 hover:scale-105 hover:bg-surface-raised hover:border-gold hover:shadow-[0_0_14px_rgba(196,148,58,0.4)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid ${
                  isFocused
                    ? 'border-gold shadow-[0_0_16px_rgba(196,148,58,0.45)] ring-1 ring-gold/60 scale-105'
                    : 'border-slot-idle/70'
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
                aria-describedby={tooltip.ariaDescribedByFor(item.id) ?? undefined}
              >
                {/* Corner bracket accents matching EquipmentSlot JRPG aesthetic */}
                <div className="pointer-events-none absolute left-0.5 top-0.5 h-1.5 w-1.5 border-l border-t border-gold/30 transition-colors group-hover:border-gold/70" />
                <div className="pointer-events-none absolute right-0.5 top-0.5 h-1.5 w-1.5 border-r border-t border-gold/30 transition-colors group-hover:border-gold/70" />
                <div className="pointer-events-none absolute bottom-0.5 left-0.5 h-1.5 w-1.5 border-b border-l border-gold/30 transition-colors group-hover:border-gold/70" />
                <div className="pointer-events-none absolute bottom-0.5 right-0.5 h-1.5 w-1.5 border-b border-r border-gold/30 transition-colors group-hover:border-gold/70" />

                <span
                  aria-hidden="true"
                  className="text-xl sm:text-2xl leading-none drop-shadow"
                >
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
