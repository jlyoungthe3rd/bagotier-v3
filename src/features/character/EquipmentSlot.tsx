import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ItemId, SlotType } from '../../types/domain';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useItem } from '../inventory/useInventoryQuery';
import { InventoryItem } from '../inventory/InventoryItem';
import { useInvalidFlash } from '../inventory/dnd';

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

type Highlight = 'idle' | 'valid' | 'invalid';

const HIGHLIGHT_CLASSES: Readonly<Record<Highlight, string>> = {
  idle: 'border-slot-idle/60',
  valid: 'border-slot-valid shadow-[0_0_14px_rgba(86,173,116,0.45)]',
  invalid: 'border-slot-invalid shadow-[0_0_14px_rgba(217,79,79,0.45)]',
};

interface EquipmentSlotProps {
  readonly slot: SlotType;
  readonly itemId: ItemId | null;
}

/**
 * A droppable equipment slot with idle/valid/invalid highlight states
 * (FR-005) and a shake animation on rejected drops (US1-AS2).
 */
export function EquipmentSlot({ slot, itemId }: EquipmentSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${slot}`,
    data: { kind: 'slot', slot },
  });
  const activeDrag = useInventoryStore((s) => s.activeDrag);
  const draggedItem = useItem(activeDrag?.itemId ?? null);
  const equippedItem = useItem(itemId);
  const invalidFlash = useInvalidFlash();
  const reducedMotion = useReducedMotion();

  let highlight: Highlight = 'idle';
  if (draggedItem !== undefined) {
    if (draggedItem.slotType === slot) highlight = 'valid';
    else if (isOver) highlight = 'invalid';
  }

  const flashNonce = invalidFlash?.slot === slot ? invalidFlash.nonce : 0;

  return (
    <motion.div
      key={`flash-${String(flashNonce)}`}
      animate={flashNonce > 0 ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-1"
    >
      <div
        ref={setNodeRef}
        data-testid={`slot-${slot}`}
        data-highlight={highlight}
        aria-label={`${SLOT_LABELS[slot]} slot`}
        className={`relative h-cell w-cell border bg-surface p-0.5 transition-all duration-200 ${HIGHLIGHT_CLASSES[highlight]}`}
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
            <span
              aria-hidden="true"
              data-testid={`slot-empty-${slot}`}
              className="flex h-full w-full items-center justify-center text-xl opacity-15 grayscale"
            >
              {SLOT_ICONS[slot]}
            </span>
          )}
        </AnimatePresence>
      </div>
      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-muted/70">
        {SLOT_LABELS[slot]}
      </span>
    </motion.div>
  );
}
