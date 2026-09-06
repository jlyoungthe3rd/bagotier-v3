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

  describe('placement and reference element', () => {
    it('initializes with placement "right" and null referenceElement', () => {
      const { result } = renderHook(() => useItemTooltipState());

      expect(result.current.snapshot.placement).toBe('right');
      expect(result.current.snapshot.referenceElement).toBeNull();
      expect(result.current.snapshot.open).toBe(false);
    });

    it('stores "left" placement in snapshot on open', () => {
      const { result } = renderHook(() => useItemTooltipState());
      const item = makeItem();
      const element = document.createElement('div');

      act(() => {
        result.current.open({
          item,
          mode: 'hover',
          element,
          placement: 'left',
        });
      });

      expect(result.current.snapshot.open).toBe(true);
      expect(result.current.snapshot.placement).toBe('left');
      expect(result.current.snapshot.referenceElement).toBe(element);
    });

    it('stores "right" placement in snapshot on open', () => {
      const { result } = renderHook(() => useItemTooltipState());
      const item = makeItem();
      const element = document.createElement('div');

      act(() => {
        result.current.open({
          item,
          mode: 'hover',
          element,
          placement: 'right',
        });
      });

      expect(result.current.snapshot.open).toBe(true);
      expect(result.current.snapshot.placement).toBe('right');
      expect(result.current.snapshot.referenceElement).toBe(element);
    });

    it('defaults placement to "right" when placement argument is omitted or undefined', () => {
      const { result } = renderHook(() => useItemTooltipState());
      const item = makeItem();

      act(() => {
        result.current.open({ item, mode: 'hover', element: null });
      });
      expect(result.current.snapshot.placement).toBe('right');

      act(() => {
        result.current.open({
          item,
          mode: 'hover',
          element: null,
          placement: undefined,
        });
      });
      expect(result.current.snapshot.placement).toBe('right');
    });

    it('updates placement and referenceElement when switching between items', () => {
      const { result } = renderHook(() => useItemTooltipState());
      const itemLeft = makeItem({ id: toItemId('item-left') });
      const itemRight = makeItem({ id: toItemId('item-right') });
      const elLeft = document.createElement('div');
      const elRight = document.createElement('div');

      act(() => {
        result.current.open({
          item: itemLeft,
          mode: 'hover',
          element: elLeft,
          placement: 'left',
        });
      });
      expect(result.current.snapshot.placement).toBe('left');
      expect(result.current.snapshot.referenceElement).toBe(elLeft);

      act(() => {
        result.current.open({
          item: itemRight,
          mode: 'hover',
          element: elRight,
          placement: 'right',
        });
      });
      expect(result.current.snapshot.placement).toBe('right');
      expect(result.current.snapshot.referenceElement).toBe(elRight);
    });

    it('resets placement to "right" and referenceElement to null on closeFor', () => {
      const { result } = renderHook(() => useItemTooltipState());
      const item = makeItem();
      const element = document.createElement('div');

      act(() => {
        result.current.open({
          item,
          mode: 'hover',
          element,
          placement: 'left',
        });
      });
      expect(result.current.snapshot.placement).toBe('left');
      expect(result.current.snapshot.referenceElement).toBe(element);

      act(() => {
        result.current.closeFor(item.id, 'hover');
      });

      expect(result.current.snapshot.open).toBe(false);
      expect(result.current.snapshot.placement).toBe('right');
      expect(result.current.snapshot.referenceElement).toBeNull();
    });

    it('resets placement to "right" and referenceElement to null on dismiss', () => {
      const { result } = renderHook(() => useItemTooltipState());
      const item = makeItem();
      const element = document.createElement('div');

      act(() => {
        result.current.open({
          item,
          mode: 'focus',
          element,
          placement: 'left',
        });
      });
      expect(result.current.snapshot.placement).toBe('left');
      expect(result.current.snapshot.referenceElement).toBe(element);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.snapshot.open).toBe(false);
      expect(result.current.snapshot.placement).toBe('right');
      expect(result.current.snapshot.referenceElement).toBeNull();
    });
  });
});

