import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useItemTooltipState } from '../../src/features/inventory/tooltip/useItemTooltipState';
import { toItemId, type Item } from '../../src/types/domain';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: toItemId('tooltip-item'),
    name: 'Tooltip Item',
    icon: '🧪',
    slotType: 'hands',
    modifiers: { str: 2 },
    ...overrides,
  };
}

describe('useItemTooltipState', () => {
  it('opens one active item at a time and replaces active id on handoff', () => {
    const { result } = renderHook(() => useItemTooltipState());
    const itemA = makeItem({ id: toItemId('item-a'), name: 'Item A' });
    const itemB = makeItem({ id: toItemId('item-b'), name: 'Item B' });

    act(() => {
      result.current.open({ item: itemA, mode: 'hover', element: null });
    });
    expect(result.current.snapshot.activeItemId).toBe(itemA.id);

    act(() => {
      result.current.open({ item: itemB, mode: 'hover', element: null });
    });
    expect(result.current.snapshot.activeItemId).toBe(itemB.id);
    expect(result.current.snapshot.open).toBe(true);
  });

  it('closes immediately when interaction source is cleared', () => {
    const { result } = renderHook(() => useItemTooltipState());
    const item = makeItem();

    act(() => {
      result.current.open({ item, mode: 'hover', element: null });
      result.current.closeFor(item.id, 'hover');
    });

    expect(result.current.snapshot.open).toBe(false);
    expect(result.current.snapshot.activeItemId).toBeNull();
  });
});
