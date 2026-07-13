import { useCallback, useMemo, useRef, useState } from 'react';
import type { Item, ItemId } from '../../../types/domain';
import { mapTooltipContent, type TooltipContent } from './mapTooltipContent';

export type TooltipTriggerMode = 'hover' | 'focus';

export interface ItemTooltipSnapshot {
  readonly open: boolean;
  readonly activeItemId: ItemId | null;
  readonly triggerMode: TooltipTriggerMode | null;
  readonly referenceElement: HTMLElement | null;
  readonly content: TooltipContent | null;
}

interface OpenArgs {
  readonly item: Item;
  readonly mode: TooltipTriggerMode;
  readonly element: HTMLElement | null;
}

export function useItemTooltipState() {
  const [snapshot, setSnapshot] = useState<ItemTooltipSnapshot>({
    open: false,
    activeItemId: null,
    triggerMode: null,
    referenceElement: null,
    content: null,
  });
  const sourcesRef = useRef<{ hover: boolean; focus: boolean }>({
    hover: false,
    focus: false,
  });

  const closeNow = useCallback(() => {
    sourcesRef.current = { hover: false, focus: false };
    setSnapshot({
      open: false,
      activeItemId: null,
      triggerMode: null,
      referenceElement: null,
      content: null,
    });
  }, []);

  const open = useCallback(
    ({ item, mode, element }: OpenArgs) => {
      const content = mapTooltipContent(item);
      if (content.isEmpty) {
        closeNow();
        return;
      }
      sourcesRef.current = { hover: mode === 'hover', focus: mode === 'focus' };
      setSnapshot({
        open: true,
        activeItemId: item.id,
        triggerMode: mode,
        referenceElement: element,
        content,
      });
    },
    [closeNow],
  );

  const closeFor = useCallback((itemId: ItemId, mode: TooltipTriggerMode) => {
    setSnapshot((current) => {
      if (!current.open || current.activeItemId !== itemId) {
        return current;
      }

      sourcesRef.current[mode] = false;
      if (sourcesRef.current.hover || sourcesRef.current.focus) {
        return current;
      }
      return {
        open: false,
        activeItemId: null,
        triggerMode: null,
        referenceElement: null,
        content: null,
      };
    });
  }, []);

  const isDescribedBy = useCallback(
    (itemId: ItemId) => snapshot.open && snapshot.activeItemId === itemId,
    [snapshot.activeItemId, snapshot.open],
  );

  return useMemo(
    () => ({
      snapshot,
      open,
      closeFor,
      dismiss: closeNow,
      isDescribedBy,
    }),
    [closeFor, closeNow, isDescribedBy, open, snapshot],
  );
}

export type ItemTooltipController = ReturnType<typeof useItemTooltipState>;
