import { beforeEach, describe, expect, it } from 'vitest';
import { useInventoryStore } from '../../src/store/useInventoryStore';

describe('keyboard navigation store state & actions (US1-5)', () => {
  beforeEach(() => {
    useInventoryStore.getState().reset();
  });

  it('initializes with default values', () => {
    const state = useInventoryStore.getState();
    expect(state.focusedSection).toBeNull();
    expect(state.focusedBagIndex).toBe(0);
    expect(state.focusedSlot).toBe('head');
    expect(state.tabHintDismissed).toBe(false);
    expect(state.showTabHint).toBe(false);
  });

  it('sets the focused section correctly', () => {
    useInventoryStore.getState().setFocusedSection('bag');
    expect(useInventoryStore.getState().focusedSection).toBe('bag');

    useInventoryStore.getState().setFocusedSection('equipment');
    expect(useInventoryStore.getState().focusedSection).toBe('equipment');

    useInventoryStore.getState().setFocusedSection(null);
    expect(useInventoryStore.getState().focusedSection).toBeNull();
  });

  it('sets the focused bag index correctly', () => {
    useInventoryStore.getState().setFocusedBagIndex(5);
    expect(useInventoryStore.getState().focusedBagIndex).toBe(5);
  });

  it('sets the focused slot correctly', () => {
    useInventoryStore.getState().setFocusedSlot('legs');
    expect(useInventoryStore.getState().focusedSlot).toBe('legs');
  });

  it('shows/dismisses the TAB hint tooltip correctly', () => {
    // Arrow key nav triggers hint initially
    useInventoryStore.getState().triggerArrowKeyNav();
    expect(useInventoryStore.getState().showTabHint).toBe(true);
    expect(useInventoryStore.getState().tabHintDismissed).toBe(false);

    // Dismissing the hint
    useInventoryStore.getState().dismissTabHint();
    expect(useInventoryStore.getState().showTabHint).toBe(false);
    expect(useInventoryStore.getState().tabHintDismissed).toBe(true);

    // Subsequent arrow key nav does not trigger hint
    useInventoryStore.getState().triggerArrowKeyNav();
    expect(useInventoryStore.getState().showTabHint).toBe(false);
  });

  it('resets keyboard nav state upon reset()', () => {
    useInventoryStore.getState().setFocusedSection('bag');
    useInventoryStore.getState().setFocusedBagIndex(12);
    useInventoryStore.getState().setFocusedSlot('weapon');
    useInventoryStore.getState().dismissTabHint();

    useInventoryStore.getState().reset();

    const state = useInventoryStore.getState();
    expect(state.focusedSection).toBeNull();
    expect(state.focusedBagIndex).toBe(0);
    expect(state.focusedSlot).toBe('head');
    expect(state.tabHintDismissed).toBe(false);
    expect(state.showTabHint).toBe(false);
  });
});
