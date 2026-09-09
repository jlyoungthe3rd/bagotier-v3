import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ItemId, SlotType } from '../../types/domain';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useItem } from '../inventory/useInventoryQuery';
import { useItemsForSlot } from '../inventory/useInventoryQuery';
import { InventoryItem } from '../inventory/InventoryItem';
import { useItemTooltip, type TooltipPlacement } from '../inventory/tooltip';
import { useSound } from '../audio/useSound';
import { handleEquipmentKeyDown } from '../inventory/keyboard';
import { FanOut, SLOT_LABELS, SLOT_FAN_DIRECTION } from './FanOut';
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

/** Delay before item tooltip opens on mouse hover (ms). */
const TOOLTIP_HOVER_DELAY = 200;

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

  const focusedSlot = useInventoryStore((s) => s.focusedSlot);
  const activeFanoutSlot = useInventoryStore((s) => s.activeFanoutSlot);
  const focusedFanoutIndex = useInventoryStore((s) => s.focusedFanoutIndex);
  const unequipped = useInventoryStore((s) => s.unequipped);
  const tooltip = useItemTooltip();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const equippedButtonRef = useRef<HTMLButtonElement | null>(null);
  const slotContainerRef = useRef<HTMLDivElement | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissedRef = useRef(false);

  // Tooltip appears on the opposite side of the fan-out direction
  const tooltipPlacement: TooltipPlacement =
    SLOT_FAN_DIRECTION[slot] === 'right' ? 'left' : 'right';

  const isActive = focusedSlot === slot;
  const isFanoutOpen = activeFanoutSlot === slot;

  // Get unequipped items for this slot type
  const allSlotItems = useItemsForSlot(slot);
  const fanoutItems = allSlotItems.filter((i) => unequipped.has(i.id));

  const openFanout = useCallback(() => {
    if (fanoutItems.length > 0) {
      const store = useInventoryStore.getState();
      if (store.activeFanoutSlot === slot) {
        return;
      }
      store.setActiveFanoutSlot(slot);
    }
  }, [slot, fanoutItems.length]);

  const closeFanout = useCallback(() => {
    const store = useInventoryStore.getState();
    if (store.activeFanoutSlot === slot) {
      store.setActiveFanoutSlot(null);
    }
  }, [slot]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current !== null) clearTimeout(hoverTimerRef.current);
      if (leaveTimerRef.current !== null) clearTimeout(leaveTimerRef.current);
      if (tooltipTimerRef.current !== null) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  const isHoveringRef = useRef(false);
  const prevEquippedItemRef = useRef(equippedItem);
  const wasFanoutOpenRef = useRef(isFanoutOpen);

  // Focus permanence on equip / unequip transitions
  useEffect(() => {
    if (prevEquippedItemRef.current !== undefined && equippedItem === undefined) {
      // Unequip transition: preserve focus on the newly mounted empty slot button
      buttonRef.current?.focus();
    } else if (
      prevEquippedItemRef.current === undefined &&
      equippedItem !== undefined &&
      wasFanoutOpenRef.current
    ) {
      // Equip transition from open fanout: preserve focus on newly equipped item button
      equippedButtonRef.current?.focus();
    }
    prevEquippedItemRef.current = equippedItem;
    wasFanoutOpenRef.current = isFanoutOpen;
  }, [equippedItem, isFanoutOpen]);

  const isDefaultSlot = focusedSlot === null && slot === 'head';
  const tabIndex = focusedSlot === slot || isDefaultSlot ? 0 : -1;

  const handleMouseEnter = () => {
    isHoveringRef.current = true;
    // Sync active slot with hover without stealing DOM focus
    useInventoryStore.getState().setFocusedSlot(slot);

    // Cancel any pending leave timer
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    // Cancel any pending tooltip timer
    if (tooltipTimerRef.current !== null) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }

    // Delay opening tooltip on hover
    if (equippedItem !== undefined) {
      tooltipTimerRef.current = setTimeout(() => {
        tooltip.open(equippedItem, 'hover', slotContainerRef.current, tooltipPlacement);
      }, TOOLTIP_HOVER_DELAY);
    }

    // If the fan-out for this slot is already open, do not re-open or re-animate
    if (useInventoryStore.getState().activeFanoutSlot === slot) {
      return;
    }
    // Dynamic hover delay: 300ms base, 200ms when visiting multiple slots within 2000ms
    const delay = getSlotHoverDelay(slot);
    hoverTimerRef.current = setTimeout(() => {
      openFanout();
    }, delay);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    isHoveringRef.current = false;
    recordSlotActivity(slot);
    // Cancel hover timer if still pending
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    // Cancel tooltip timer if still pending
    if (tooltipTimerRef.current !== null) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    if (equippedItem !== undefined) {
      tooltip.closeFor(equippedItem.id, 'hover');
    }
    // If moving into child elements (like fanned items), do not close
    const related = e.relatedTarget;
    if (related instanceof Node && e.currentTarget.contains(related)) {
      return;
    }
    // Grace period before closing — allows moving to fanned items
    if (isFanoutOpen) {
      leaveTimerRef.current = setTimeout(() => {
        closeFanout();
      }, FANOUT_LEAVE_GRACE);
    }
    // If slot does not have keyboard DOM focus, clear active slot on mouse leave
    const hasFocus =
      document.activeElement === buttonRef.current ||
      document.activeElement === equippedButtonRef.current;
    if (!hasFocus) {
      const store = useInventoryStore.getState();
      if (store.focusedSlot === slot) {
        store.setFocusedSlot(null);
      }
    }
  };

  // Cancel a pending leave timer (used when mouse enters a fanned item)
  const cancelLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  // Start a leave timer to close the fan-out after a grace period
  // (used when mouse leaves a fanned item into empty space)
  const startLeaveTimer = useCallback(() => {
    if (isFanoutOpen) {
      leaveTimerRef.current = setTimeout(() => {
        closeFanout();
      }, FANOUT_LEAVE_GRACE);
    }
  }, [isFanoutOpen, closeFanout]);

  return (
    <div
      className={`relative flex flex-col items-center gap-1 transition-transform motion-reduce:transition-none ${
        isFanoutOpen ? 'z-30' : 'z-10'
      }`}
    >
      <div
        ref={slotContainerRef}
        data-testid={`slot-${slot}`}
        aria-label={`${SLOT_LABELS[slot]} slot`}
        className={`group relative h-cell w-cell border bg-surface p-0.5 transition-all duration-200 motion-reduce:transition-none ${
          isFanoutOpen
            ? 'border-gold/90 shadow-[0_0_14px_rgba(196,148,58,0.35),0_0_6px_rgba(212,104,58,0.25)] ring-1 ring-gold/40'
            : isActive
              ? 'border-gold/70 shadow-[0_0_10px_rgba(196,148,58,0.25),0_0_4px_rgba(212,104,58,0.2)]'
              : 'border-slot-idle/70 hover:border-gold/70 hover:shadow-[0_0_10px_rgba(196,148,58,0.25),0_0_4px_rgba(212,104,58,0.2)]'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Corner bracket accents — the JRPG-style slot framing */}
        <div
          className={`pointer-events-none absolute left-0.5 top-0.5 h-2.5 w-2.5 border-l border-t transition-colors ${
            isFanoutOpen
              ? 'border-gold/90'
              : isActive
                ? 'border-gold/80'
                : 'border-gold/40 group-hover:border-gold/80'
          }`}
        />
        <div
          className={`pointer-events-none absolute right-0.5 top-0.5 h-2.5 w-2.5 border-r border-t transition-colors ${
            isFanoutOpen
              ? 'border-gold/90'
              : isActive
                ? 'border-gold/80'
                : 'border-gold/40 group-hover:border-gold/80'
          }`}
        />
        <div
          className={`pointer-events-none absolute bottom-0.5 left-0.5 h-2.5 w-2.5 border-b border-l transition-colors ${
            isFanoutOpen
              ? 'border-gold/90'
              : isActive
                ? 'border-gold/80'
                : 'border-gold/40 group-hover:border-gold/80'
          }`}
        />
        <div
          className={`pointer-events-none absolute bottom-0.5 right-0.5 h-2.5 w-2.5 border-b border-r transition-colors ${
            isFanoutOpen
              ? 'border-gold/90'
              : isActive
                ? 'border-gold/80'
                : 'border-gold/40 group-hover:border-gold/80'
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
                slotElement={slotContainerRef.current}
                tooltipPlacement={tooltipPlacement}
                data-tooltip-surface="equipment"
                hasFanout={fanoutItems.length > 0}
                isFanoutOpen={isFanoutOpen}
                onDismissFanout={closeFanout}
                disableHoverTooltip
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
                  ? isFanoutOpen
                    ? `${String(fanoutItems.length)} items available. Press Enter or Space to equip.`
                    : `${String(fanoutItems.length)} items available. Press Enter or Space to open options.`
                  : undefined
              }
              className="flex h-full w-full items-center justify-center bg-transparent transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid motion-reduce:transition-none"
              onFocus={() => {
                isHoveringRef.current = false;
                useInventoryStore.getState().setFocusedSlot(slot);
                tooltip.dismiss();
                if (fanoutItems.length > 0 && !dismissedRef.current) {
                  openFanout();
                }
              }}
              onBlur={() => {
                dismissedRef.current = false;
              }}
              onClick={() => {
                dismissedRef.current = false;
                if (fanoutItems.length > 0 && !isFanoutOpen) {
                  openFanout();
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  dismissedRef.current = true;
                }
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
                    play('equip');
                  }
                  return;
                }
                if (
                  (event.key === 'Enter' || event.key === ' ') &&
                  !isFanoutOpen &&
                  fanoutItems.length > 0
                ) {
                  event.preventDefault();
                  dismissedRef.current = false;
                  openFanout();
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
      </div>

      {/* Horizontal fan-out of unequipped items — rendered outside inner slot
          div so mouse movement from slot to fanned items stays within the
          outer container's mouse-event bounds and doesn't trigger premature
          close. */}
      {isFanoutOpen && fanoutItems.length > 0 && (
        <FanOut
          slot={slot}
          items={fanoutItems}
          slotElement={slotContainerRef.current}
          tooltipPlacement={tooltipPlacement}
          onDismiss={() => {
            dismissedRef.current = true;
            const target = buttonRef.current ?? equippedButtonRef.current;
            target?.focus();
          }}
          onMouseEnter={cancelLeaveTimer}
          onMouseLeave={startLeaveTimer}
          skipInitialFocus={isHoveringRef.current}
        />
      )}
      <span
        className={`text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors motion-reduce:transition-none ${
          isFanoutOpen || isActive ? 'text-gold' : 'text-ink-muted'
        }`}
      >
        {SLOT_LABELS[slot]}
      </span>
    </div>
  );
}
