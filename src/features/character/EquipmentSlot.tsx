import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ItemId, SlotType } from '../../types/domain';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useItem } from '../inventory/useInventoryQuery';
import { useItemsForSlot } from '../inventory/useInventoryQuery';
import { InventoryItem } from '../inventory/InventoryItem';
import { useItemTooltip } from '../inventory/tooltip';
import { useSound } from '../audio/useSound';
import { handleEquipmentKeyDown } from '../inventory/keyboard';
import { FanOut, SLOT_LABELS } from './FanOut';
import { getSlotHoverDelay, recordSlotActivity } from './slotHoverManager';

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
  const play = useSound();

  const focusedSection = useInventoryStore((s) => s.focusedSection);
  const focusedSlot = useInventoryStore((s) => s.focusedSlot);
  const activeFanoutSlot = useInventoryStore((s) => s.activeFanoutSlot);
  const focusedFanoutIndex = useInventoryStore((s) => s.focusedFanoutIndex);
  const unequipped = useInventoryStore((s) => s.unequipped);
  const tooltip = useItemTooltip();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const equippedButtonRef = useRef<HTMLButtonElement | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = focusedSection === 'equipment' && focusedSlot === slot;
  const isFanoutOpen = activeFanoutSlot === slot;

  // Get unequipped items for this slot type
  const allSlotItems = useItemsForSlot(slot);
  const fanoutItems = allSlotItems.filter((i) => unequipped.has(i.id));

  const openFanout = useCallback(() => {
    if (fanoutItems.length > 0) {
      const store = useInventoryStore.getState();
      store.setActiveFanoutSlot(slot);
      store.setFeedback(
        `${SLOT_LABELS[slot]} slot options opened. ${fanoutItems.length} items available.`,
      );
    }
  }, [slot, fanoutItems.length]);

  const closeFanout = useCallback(() => {
    const store = useInventoryStore.getState();
    if (store.activeFanoutSlot === slot) {
      store.setActiveFanoutSlot(null);
      store.setFeedback(`Closed ${SLOT_LABELS[slot]} slot options.`);
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

  // Restore focus to slot button or equipped item when fan-out closes while slot is active
  const prevFanoutOpenRef = useRef(isFanoutOpen);
  useEffect(() => {
    if (prevFanoutOpenRef.current && !isFanoutOpen && isActive) {
      const target = buttonRef.current ?? equippedButtonRef.current;
      if (target && document.activeElement !== target) {
        target.focus();
      }
    }
    prevFanoutOpenRef.current = isFanoutOpen;
  }, [isFanoutOpen, isActive]);

  // Open fan-out when empty slot transitions to active (keyboard focus)
  const prevActiveRef = useRef(isActive);
  useEffect(() => {
    if (!prevActiveRef.current && isActive && equippedItem === undefined && fanoutItems.length > 0) {
      openFanout();
    }
    prevActiveRef.current = isActive;
  }, [isActive, equippedItem, openFanout, fanoutItems.length]);

  const isDefaultSlot = focusedSection === null && slot === 'head';
  const tabIndex =
    (focusedSection === 'equipment' && focusedSlot === slot) || isDefaultSlot ? 0 : -1;

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
      className={`relative flex flex-col items-center gap-1 transition-transform motion-reduce:transition-none ${
        isFanoutOpen ? 'z-30' : 'z-10'
      }`}
      onMouseEnter={handleContainerMouseEnter}
      onMouseLeave={handleContainerMouseLeave}
    >
      <div
        data-testid={`slot-${slot}`}
        aria-label={`${SLOT_LABELS[slot]} slot`}
        className={`group relative h-cell w-cell border bg-surface p-0.5 transition-all duration-200 motion-reduce:transition-none ${
          isFanoutOpen
            ? 'border-gold/90 shadow-[0_0_14px_rgba(196,148,58,0.35)] ring-1 ring-gold/40'
            : isActive
              ? 'border-gold/70 shadow-[0_0_8px_rgba(196,148,58,0.2)]'
              : 'border-slot-idle/60 hover:border-gold/50'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Corner bracket accents — the JRPG-style slot framing */}
        <div
          className={`pointer-events-none absolute left-0.5 top-0.5 h-2.5 w-2.5 border-l border-t transition-colors ${
            isFanoutOpen ? 'border-gold/90' : 'border-gold/40 group-hover:border-gold/60'
          }`}
        />
        <div
          className={`pointer-events-none absolute right-0.5 top-0.5 h-2.5 w-2.5 border-r border-t transition-colors ${
            isFanoutOpen ? 'border-gold/90' : 'border-gold/40 group-hover:border-gold/60'
          }`}
        />
        <div
          className={`pointer-events-none absolute bottom-0.5 left-0.5 h-2.5 w-2.5 border-b border-l transition-colors ${
            isFanoutOpen ? 'border-gold/90' : 'border-gold/40 group-hover:border-gold/60'
          }`}
        />
        <div
          className={`pointer-events-none absolute bottom-0.5 right-0.5 h-2.5 w-2.5 border-b border-r transition-colors ${
            isFanoutOpen ? 'border-gold/90' : 'border-gold/40 group-hover:border-gold/60'
          }`}
        />

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
              transition={{ duration: reducedMotion === true ? 0 : 0.18 }}
            >
              <InventoryItem
                ref={equippedButtonRef}
                item={equippedItem}
                slot={slot}
                data-tooltip-surface="equipment"
                hasFanout={fanoutItems.length > 0}
                isFanoutOpen={isFanoutOpen}
                onDismissFanout={closeFanout}
              />
            </motion.div>
          ) : (
            <button
              ref={buttonRef}
              type="button"
              tabIndex={tabIndex}
              data-testid={`slot-empty-button-${slot}`}
              aria-label={`Empty ${SLOT_LABELS[slot]} slot`}
              aria-haspopup={fanoutItems.length > 0 ? 'listbox' : undefined}
              aria-expanded={fanoutItems.length > 0 ? isFanoutOpen : undefined}
              aria-controls={
                isFanoutOpen && fanoutItems.length > 0
                  ? `fanout-listbox-${slot}`
                  : undefined
              }
              aria-activedescendant={
                isFanoutOpen && fanoutItems[focusedFanoutIndex]
                  ? `fanout-item-${fanoutItems[focusedFanoutIndex].id}`
                  : undefined
              }
              aria-description={
                fanoutItems.length > 0
                  ? `${fanoutItems.length} items available. Press Enter or Space to equip.`
                  : undefined
              }
              className="flex h-full w-full items-center justify-center bg-transparent transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid motion-reduce:transition-none"
              onFocus={() => {
                useInventoryStore.getState().setFocusedSection('equipment');
                useInventoryStore.getState().setFocusedSlot(slot);
                tooltip.dismiss();
              }}
              onKeyDown={(event) => {
                if (
                  (event.key === 'Enter' || event.key === ' ') &&
                  isFanoutOpen &&
                  fanoutItems.length > 0
                ) {
                  event.preventDefault();
                  const selectedItem =
                    fanoutItems[useInventoryStore.getState().focusedFanoutIndex];
                  if (selectedItem !== undefined) {
                    const store = useInventoryStore.getState();
                    store.equip(selectedItem.id, slot);
                    store.setActiveFanoutSlot(null);
                    store.setFeedback(
                      `Equipped ${selectedItem.name} to ${SLOT_LABELS[slot]} slot.`,
                    );
                    play('equip');
                  }
                  return;
                }
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
          <FanOut
            slot={slot}
            items={fanoutItems}
            onDismiss={() => {
              const target = buttonRef.current ?? equippedButtonRef.current;
              target?.focus();
            }}
          />
        )}
      </div>
      <span
        className={`text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors motion-reduce:transition-none ${
          isFanoutOpen ? 'text-gold' : 'text-ink-muted'
        }`}
      >
        {SLOT_LABELS[slot]}
      </span>
    </div>
  );
}
