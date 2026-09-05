import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ItemId, SlotType } from '../../types/domain';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useItem } from '../inventory/useInventoryQuery';
import { useItemsForSlot } from '../inventory/useInventoryQuery';
import { InventoryItem } from '../inventory/InventoryItem';
import { useItemTooltip } from '../inventory/tooltip';
import { handleEquipmentKeyDown } from '../inventory/keyboard';
import { FanOut } from './FanOut';
import { getSlotHoverDelay, recordSlotActivity } from './slotHoverManager';

const SLOT_LABELS: Readonly<Record<SlotType, string>> = {
  head: 'Head',
  body: 'Body',
  legs: 'Legs',
  hands: 'Hands',
  feet: 'Feet',
  weapon: 'Weapon',
  accessory: 'Accessory',
};

const SLOT_ICONS: Readonly<Record<SlotType, string>> = {
  head: '🪖',
  body: '🦺',
  legs: '👖',
  hands: '🧤',
  feet: '🥾',
  weapon: '⚔️',
  accessory: '💍',
};

/** Grace period for mouse leaving slot before closing fan-out (ms). */
const FANOUT_LEAVE_GRACE = 200;

interface EquipmentSlotProps {
  readonly slot: SlotType;
  readonly itemId: ItemId | null;
}

/**
 * An equipment slot displaying the equipped item icon or an empty silhouette.
 * Hovering (500ms delay) or focusing opens a radial fan-out of unequipped items.
 */
export function EquipmentSlot({ slot, itemId }: EquipmentSlotProps) {
  const equippedItem = useItem(itemId);
  const reducedMotion = useReducedMotion();

  const focusedSection = useInventoryStore((s) => s.focusedSection);
  const focusedSlot = useInventoryStore((s) => s.focusedSlot);
  const activeFanoutSlot = useInventoryStore((s) => s.activeFanoutSlot);
  const unequipped = useInventoryStore((s) => s.unequipped);
  const tooltip = useItemTooltip();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = focusedSection === 'equipment' && focusedSlot === slot;
  const isFanoutOpen = activeFanoutSlot === slot;

  // Get unequipped items for this slot type
  const allSlotItems = useItemsForSlot(slot);
  const fanoutItems = allSlotItems.filter((i) => unequipped.has(i.id));

  const openFanout = useCallback(() => {
    if (fanoutItems.length > 0) {
      useInventoryStore.getState().setActiveFanoutSlot(slot);
    }
  }, [slot, fanoutItems.length]);

  const closeFanout = useCallback(() => {
    if (useInventoryStore.getState().activeFanoutSlot === slot) {
      useInventoryStore.getState().setActiveFanoutSlot(null);
    }
  }, [slot]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) clearTimeout(hoverTimerRef.current);
      if (leaveTimerRef.current !== null) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isActive && equippedItem === undefined) {
      if (buttonRef.current && document.activeElement !== buttonRef.current) {
        buttonRef.current.focus();
      }
    }
  }, [isActive, equippedItem]);

  // Open fan-out immediately on keyboard focus
  useEffect(() => {
    if (isActive && fanoutItems.length > 0) {
      openFanout();
    }
  }, [isActive, openFanout, fanoutItems.length]);

  const tabIndex = focusedSection === 'equipment' && focusedSlot === slot ? 0 : -1;

  const handleMouseEnter = () => {
    // Cancel any pending leave timer
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    // Dynamic hover delay: 300ms base, 200ms when visiting multiple slots within 2000ms
    const delay = getSlotHoverDelay(slot);
    hoverTimerRef.current = setTimeout(() => {
      openFanout();
    }, delay);
  };

  const handleMouseLeave = () => {
    recordSlotActivity(slot);
    // Cancel hover timer if still pending
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    // Grace period before closing — allows moving to fanned items
    if (isFanoutOpen) {
      leaveTimerRef.current = setTimeout(() => {
        closeFanout();
      }, FANOUT_LEAVE_GRACE);
    }
  };

  // When mouse re-enters the fan-out area (the outer container), cancel the leave timer
  const handleContainerMouseEnter = () => {
    recordSlotActivity(slot);
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const handleContainerMouseLeave = () => {
    recordSlotActivity(slot);
    // Cancel hover timer
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    // Close fan-out with grace period
    if (isFanoutOpen) {
      leaveTimerRef.current = setTimeout(() => {
        closeFanout();
      }, FANOUT_LEAVE_GRACE);
    }
  };

  return (
    <div
      className="relative flex flex-col items-center gap-1"
      onMouseEnter={handleContainerMouseEnter}
      onMouseLeave={handleContainerMouseLeave}
    >
      <div
        data-testid={`slot-${slot}`}
        aria-label={`${SLOT_LABELS[slot]} slot`}
        className="relative h-cell w-cell border bg-surface p-0.5 transition-all duration-200 border-slot-idle/60"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Corner bracket accents — the JRPG-style slot framing */}
        <div className="pointer-events-none absolute left-0.5 top-0.5 h-2.5 w-2.5 border-l border-t border-gold/40" />
        <div className="pointer-events-none absolute right-0.5 top-0.5 h-2.5 w-2.5 border-r border-t border-gold/40" />
        <div className="pointer-events-none absolute bottom-0.5 left-0.5 h-2.5 w-2.5 border-b border-l border-gold/40" />
        <div className="pointer-events-none absolute bottom-0.5 right-0.5 h-2.5 w-2.5 border-b border-r border-gold/40" />

        <AnimatePresence mode="popLayout" initial={false}>
          {equippedItem !== undefined ? (
            <motion.div
              key={equippedItem.id}
              className="h-full w-full"
              initial={reducedMotion === true ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={
                reducedMotion === true
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { scale: 0.6, opacity: 0 }
              }
              transition={{ duration: 0.18 }}
            >
              <InventoryItem
                item={equippedItem}
                slot={slot}
                data-tooltip-surface="equipment"
              />
            </motion.div>
          ) : (
            <button
              ref={buttonRef}
              type="button"
              tabIndex={tabIndex}
              data-testid={`slot-empty-button-${slot}`}
              aria-label={`Empty ${SLOT_LABELS[slot]} slot`}
              className="flex h-full w-full items-center justify-center bg-transparent transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid"
              onFocus={() => {
                useInventoryStore.getState().setFocusedSection('equipment');
                useInventoryStore.getState().setFocusedSlot(slot);
                tooltip.dismiss();
              }}
              onKeyDown={(event) => {
                handleEquipmentKeyDown(event, slot, fanoutItems.length);
              }}
            >
              <span
                aria-hidden="true"
                data-testid={`slot-empty-${slot}`}
                className="flex h-full w-full items-center justify-center text-xl opacity-15 grayscale"
              >
                {SLOT_ICONS[slot]}
              </span>
            </button>
          )}
        </AnimatePresence>

        {/* Radial fan-out of unequipped items */}
        {isFanoutOpen && fanoutItems.length > 0 && (
          <FanOut slot={slot} items={fanoutItems} />
        )}
      </div>
      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-muted/70">
        {SLOT_LABELS[slot]}
      </span>
    </div>
  );
}
