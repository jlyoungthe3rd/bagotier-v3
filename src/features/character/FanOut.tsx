import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Item, SlotType } from '../../types/domain';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useItemTooltip } from '../inventory/tooltip';
import { useSound } from '../audio/useSound';

export type HorizontalFanDirection = 'left' | 'right' | 'center';

/**
 * Horizontal expansion direction based on slot placement in the paper doll:
 * - Weapon, hands, and legs fan outward to the left
 * - Head, body, accessory, and feet fan outward to the right
 */
export const SLOT_FAN_DIRECTION: Readonly<Record<SlotType, HorizontalFanDirection>> = {
  weapon: 'left',
  hands: 'left',
  legs: 'left',
  head: 'right',
  body: 'right',
  accessory: 'right',
  feet: 'right',
};

/** Horizontal step between items (px) for desktop/tablet. */
export const DESKTOP_STEP = 64;

/** Horizontal step between items (px) for mobile. */
export const MOBILE_STEP = 50;

/** Distance constants retained for backwards-compatibility */
export const FAN_RADIUS_DESKTOP = 68;
export const FAN_RADIUS_MOBILE = 54;
export const FAN_ARC = 0;

/**
 * Computes strictly horizontal positions (y = 0) for available items:
 * - Left slots: negative X offsets stepping outward to the left
 * - Right slots: positive X offsets stepping outward to the right
 * - Center slots: flanking symmetrically around the slot center without covering it
 */
export function computeFanPositions(
  slot: SlotType,
  count: number,
  radius?: number,
  isMobile = false,
): { x: number; y: number }[] {
  if (count <= 0) return [];

  const direction = SLOT_FAN_DIRECTION[slot];
  const step =
    radius !== undefined && radius !== FAN_RADIUS_DESKTOP && radius !== FAN_RADIUS_MOBILE
      ? radius
      : isMobile
        ? MOBILE_STEP
        : DESKTOP_STEP;

  if (direction === 'left') {
    return Array.from({ length: count }, (_, i) => ({
      x: -(i + 1) * step,
      y: 0,
    }));
  }

  if (direction === 'right') {
    return Array.from({ length: count }, (_, i) => ({
      x: (i + 1) * step,
      y: 0,
    }));
  }

  // 'center': symmetrically flank the slot horizontally at y = 0
  const leftCount = Math.floor(count / 2);
  return Array.from({ length: count }, (_, i) => {
    if (i < leftCount) {
      return {
        x: -(leftCount - i) * step,
        y: 0,
      };
    }
    return {
      x: (i - leftCount + 1) * step,
      y: 0,
    };
  });
}

const FALLBACK_ICON = '◻️';

function resolveIcon(icon: string): string {
  return icon.trim().length > 0 ? icon : FALLBACK_ICON;
}

export const SLOT_LABELS: Readonly<Record<SlotType, string>> = {
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

  const basePositions = useMemo(
    () => computeFanPositions(slot, items.length, undefined, isMobile),
    [slot, items.length, isMobile],
  );

  const [positions, setPositions] = useState<{ x: number; y: number }[]>(basePositions);

  // Viewport bounds clamping: ensure no horizontally fanned item clips or overflows viewport edges
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
    const itemHalfSize = isMobile ? 22 : 28;
    const margin = 12; // Safety margin from viewport edge (px)

    const minLeft = Math.min(
      ...basePositions.map((pos) => slotCenterX + pos.x - itemHalfSize),
    );
    const maxRight = Math.max(
      ...basePositions.map((pos) => slotCenterX + pos.x + itemHalfSize),
    );

    const overflowsLeft = minLeft < margin;
    const overflowsRight = maxRight > window.innerWidth - margin;

    if (!overflowsLeft && !overflowsRight) {
      setPositions(basePositions);
      return;
    }

    // Proportional scaling ensures items compress smoothly without stacking or overlapping
    const maxNegativeOffset = Math.abs(Math.min(0, ...basePositions.map((p) => p.x)));
    const maxPositiveOffset = Math.max(0, ...basePositions.map((p) => p.x));

    const maxAvailableLeft = Math.max(0, slotCenterX - margin - itemHalfSize);
    const maxAvailableRight = Math.max(
      0,
      window.innerWidth - margin - itemHalfSize - slotCenterX,
    );

    const scaleLeft =
      overflowsLeft && maxNegativeOffset > 0
        ? Math.min(1, maxAvailableLeft / maxNegativeOffset)
        : 1;

    const scaleRight =
      overflowsRight && maxPositiveOffset > 0
        ? Math.min(1, maxAvailableRight / maxPositiveOffset)
        : 1;

    const scaled = basePositions.map((pos) => {
      let { x } = pos;
      if (x < 0) {
        x = Math.round(x * scaleLeft);
      } else if (x > 0) {
        x = Math.round(x * scaleRight);
      }
      return { x, y: 0 };
    });

    setPositions(scaled);
  }, [basePositions, isMobile]);

  // Focus the active fan-out item when index changes or on mount
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
        // Close fanout cleanly on tab out and announce state to live region
        store.setActiveFanoutSlot(null);
        store.setFeedback(`Closed ${SLOT_LABELS[slot]} slot options.`);
        break;
    }
  };

  const instructionId = `fanout-instructions-${slot}`;

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
        <span id={instructionId} className="sr-only">
          Use left and right arrow keys to navigate, Enter or Space to equip, Escape to close.
        </span>
        {items.map((item, i) => {
          const pos = positions[i] ?? { x: 0, y: 0 };
          const isFocused = focusedFanoutIndex === i;
          const tooltipDescribedBy = tooltip.ariaDescribedByFor(item.id);
          const describedBy = [tooltipDescribedBy, instructionId]
            .filter(Boolean)
            .join(' ');

          return (
            <motion.div
              key={item.id}
              role="presentation"
              className="pointer-events-auto absolute left-1/2 top-1/2"
              initial={
                reducedMotion === true
                  ? false
                  : { scale: 0.8, opacity: 0, x: '-50%', y: '-50%' }
              }
              animate={{
                scale: 1,
                opacity: 1,
                x: `calc(-50% + ${String(pos.x)}px)`,
                y: '-50%',
              }}
              exit={
                reducedMotion === true
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { scale: 0.8, opacity: 0, x: '-50%', y: '-50%' }
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
                aria-describedby={describedBy}
                data-testid={`fanout-item-${item.id}`}
                className={`group relative flex h-11 w-11 sm:h-cell sm:w-cell items-center justify-center rounded-sm border bg-surface-raised/95 backdrop-blur-md p-1 text-ink shadow-lg shadow-surface-sunken/80 transition-all duration-200 ease-out outline-offset-2 hover:scale-105 hover:bg-surface-raised hover:border-ember hover:shadow-[0_0_14px_rgba(212,104,58,0.4),0_0_6px_rgba(196,148,58,0.3)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid motion-reduce:transition-none motion-reduce:transform-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${
                  isFocused
                    ? 'border-gold shadow-[0_0_16px_rgba(196,148,58,0.45),0_0_8px_rgba(212,104,58,0.3)] ring-1 ring-gold/60 scale-105'
                    : 'border-slot-idle/80'
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
                {/* Corner bracket accents matching EquipmentSlot JRPG aesthetic */}
                <div
                  className={`pointer-events-none absolute left-0.5 top-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 border-l border-t transition-colors ${
                    isFocused
                      ? 'border-gold'
                      : 'border-gold/40 group-hover:border-ember/90'
                  }`}
                />
                <div
                  className={`pointer-events-none absolute right-0.5 top-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 border-r border-t transition-colors ${
                    isFocused
                      ? 'border-gold'
                      : 'border-gold/40 group-hover:border-ember/90'
                  }`}
                />
                <div
                  className={`pointer-events-none absolute bottom-0.5 left-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 border-b border-l transition-colors ${
                    isFocused
                      ? 'border-gold'
                      : 'border-gold/40 group-hover:border-ember/90'
                  }`}
                />
                <div
                  className={`pointer-events-none absolute bottom-0.5 right-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 border-b border-r transition-colors ${
                    isFocused
                      ? 'border-gold'
                      : 'border-gold/40 group-hover:border-ember/90'
                  }`}
                />

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
