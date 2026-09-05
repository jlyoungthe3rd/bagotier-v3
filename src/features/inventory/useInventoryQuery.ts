import { useQuery } from '@tanstack/react-query';
import type { Item, ItemId, SlotType } from '../../types/domain';
import { fetchItems } from '../../mocks/api';
import { queryKeys } from '../../lib/queryKeys';

/** Fetches the immutable item catalog. */
export function useInventoryQuery() {
  return useQuery({
    queryKey: queryKeys.items,
    queryFn: fetchItems,
  });
}

/**
 * Resolves an {@link ItemId} to its catalog entity via the React Query cache
 * (store-contracts.md rule 2) — components never look items up in Zustand.
 */
export function useItem(id: ItemId | null): Item | undefined {
  const { data } = useQuery({
    queryKey: queryKeys.items,
    queryFn: fetchItems,
    select: (items) => (id === null ? undefined : items.find((i) => i.id === id)),
  });
  return data;
}

/** Returns all catalog items matching a given slot type. Used by fan-out to get candidates. */
export function useItemsForSlot(slot: SlotType): Item[] {
  const { data } = useQuery({
    queryKey: queryKeys.items,
    queryFn: fetchItems,
    select: (items) => items.filter((i) => i.slotType === slot),
  });
  return data ?? [];
}
