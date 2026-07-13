import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ItemId, SlotType } from '../../types/domain';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useItem } from '../inventory/useInventoryQuery';
import { InventoryItem } from '../inventory/InventoryItem';
import { useEffect, useRef } from 'react';
import { useItemTooltip } from '../inventory/tooltip';
import { handleEquipmentKeyDown } from '../inventory/keyboard';

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

interface EquipmentSlotProps {
  readonly slot: SlotType;
  readonly itemId: ItemId | null;
}

/**
 * An equipment slot displaying the equipped item icon or an empty silhouette.
 */
export function EquipmentSlot({ slot, itemId }: EquipmentSlotProps) {
  const equippedItem = useItem(itemId);
  const reducedMotion = useReducedMotion();

  const focusedSection = useInventoryStore((s) => s.focusedSection);
  const focusedSlot = useInventoryStore((s) => s.focusedSlot);
  const tooltip = useItemTooltip();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const isActive = focusedSection === 'equipment' && focusedSlot === slot;

  useEffect(() => {
    if (isActive && equippedItem === undefined) {
      if (buttonRef.current && document.activeElement !== buttonRef.current) {
        buttonRef.current.focus();
      }
    }
  }, [isActive, equippedItem]);

  const tabIndex = focusedSection === 'equipment' && focusedSlot === slot ? 0 : -1;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        data-testid={`slot-${slot}`}
        aria-label={`${SLOT_LABELS[slot]} slot`}
        className="relative h-cell w-cell border bg-surface p-0.5 transition-all duration-200 border-slot-idle/60"
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
                origin={{ kind: 'slot', slot }}
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
                handleEquipmentKeyDown(event, slot);
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
      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-muted/70">
        {SLOT_LABELS[slot]}
      </span>
    </div>
  );
}
