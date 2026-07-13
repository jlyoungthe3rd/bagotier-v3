import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  type PropsWithChildren,
} from 'react';
import type { Item, ItemId } from '../../../types/domain';
import {
  useItemTooltipState,
  type ItemTooltipController,
  type TooltipTriggerMode,
} from './useItemTooltipState';

interface ItemTooltipContextValue {
  readonly tooltipId: string;
  readonly open: (
    item: Item,
    mode: TooltipTriggerMode,
    element: HTMLElement | null,
  ) => void;
  readonly closeFor: (itemId: ItemId, mode: TooltipTriggerMode) => void;
  readonly dismiss: () => void;
  readonly ariaDescribedByFor: (itemId: ItemId) => string | undefined;
}

const ItemTooltipContext = createContext<ItemTooltipContextValue | null>(null);

function TooltipNode({
  controller,
  tooltipId,
}: {
  controller: ItemTooltipController;
  tooltipId: string;
}) {
  const { snapshot } = controller;
  const { refs, floatingStyles, update, placement } = useFloating({
    open: snapshot.open,
    placement: 'right',
    middleware: [
      offset(10),
      flip({ fallbackPlacements: ['left', 'top', 'bottom'] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    refs.setReference(snapshot.referenceElement);
  }, [refs, snapshot.referenceElement]);

  useEffect(() => {
    if (snapshot.open) {
      update();
    }
  }, [snapshot.open, update, snapshot.activeItemId]);

  if (!snapshot.open || snapshot.content == null || snapshot.content.isEmpty) {
    return null;
  }

  return (
    <FloatingPortal>
      <div
        id={tooltipId}
        ref={refs.setFloating}
        role="tooltip"
        data-placement={placement}
        className="item-tooltip pointer-events-none z-50 max-w-56 rounded border border-gold/40 bg-surface-raised/95 px-3 py-2 text-left text-xs text-ink shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
        style={floatingStyles}
      >
        <p className="font-semibold leading-snug">{snapshot.content.title}</p>
        {snapshot.content.subtitle !== undefined ? (
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-gold/90">
            {snapshot.content.subtitle}
          </p>
        ) : null}
        {snapshot.content.metadataLines.length > 0 ? (
          <ul className="mt-1.5 space-y-0.5 text-[11px] text-ink-muted">
            {snapshot.content.metadataLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </FloatingPortal>
  );
}

export function ItemTooltipProvider({ children }: PropsWithChildren) {
  const controller = useItemTooltipState();
  const tooltipId = useId();

  return (
    <ItemTooltipContext.Provider
      value={{
        tooltipId,
        open: (item, mode, element) => controller.open({ item, mode, element }),
        closeFor: controller.closeFor,
        dismiss: controller.dismiss,
        ariaDescribedByFor: (itemId) =>
          controller.isDescribedBy(itemId) ? tooltipId : undefined,
      }}
    >
      {children}
      <TooltipNode controller={controller} tooltipId={tooltipId} />
    </ItemTooltipContext.Provider>
  );
}

export function useItemTooltip() {
  const value = useContext(ItemTooltipContext);
  if (value == null) {
    throw new Error('useItemTooltip must be used within ItemTooltipProvider');
  }
  return value;
}
