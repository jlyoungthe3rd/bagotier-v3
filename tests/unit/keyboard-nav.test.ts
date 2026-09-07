import { beforeEach, describe, expect, it } from 'vitest';
import { useInventoryStore } from '../../src/store/useInventoryStore';

describe('keyboard navigation store state & actions (US1-5)', () => {
  beforeEach(() => {
    useInventoryStore.getState().reset();
  });

  it('initializes with default values', () => {
    const state = useInventoryStore.getState();
    expect(state.focusedSlot).toBeNull();
    expect(state.activeFanoutSlot).toBeNull();
    expect(state.focusedFanoutIndex).toBe(0);
  });

  it('sets the focused slot correctly', () => {
    useInventoryStore.getState().setFocusedSlot('legs');
    expect(useInventoryStore.getState().focusedSlot).toBe('legs');
  });

  it('manages active fanout slot and focused fanout index', () => {
    useInventoryStore.getState().setActiveFanoutSlot('head');
    expect(useInventoryStore.getState().activeFanoutSlot).toBe('head');
    expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);

    useInventoryStore.getState().setFocusedFanoutIndex(1);
    expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);

    useInventoryStore.getState().setActiveFanoutSlot(null);
    expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();
  });

  it('resets keyboard nav state upon reset()', () => {
    useInventoryStore.getState().setFocusedSlot('weapon');
    useInventoryStore.getState().setActiveFanoutSlot('weapon');
    useInventoryStore.getState().setFocusedFanoutIndex(2);

    useInventoryStore.getState().reset();

    const state = useInventoryStore.getState();
    expect(state.focusedSlot).toBeNull();
    expect(state.activeFanoutSlot).toBeNull();
    expect(state.focusedFanoutIndex).toBe(0);
  });
});
