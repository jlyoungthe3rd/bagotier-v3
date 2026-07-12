import { describe, expect, it } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import { renderApp } from './dnd-test-utils';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { character } from '../../src/mocks/character';
import { SLOT_TYPES, toItemId } from '../../src/types/domain';

/**
 * US5 — the generated character is the centerpiece with slots spatially
 * arranged by body region.
 */
describe('character presentation (US5)', () => {
  it('renders the generated character from query data', async () => {
    await renderApp();
    const view = screen.getByTestId('character-view');
    expect(view).toBeInTheDocument();
    // The generated figure is present (SVG composed from appearance parts).
    expect(view.querySelector('svg')).not.toBeNull();
    expect(within(view).getByText(character.name)).toBeInTheDocument();
  });

  it('shows all 7 slots, labeled and identifiable, arranged by body region', async () => {
    await renderApp();
    const view = screen.getByTestId('character-view');
    for (const slot of SLOT_TYPES) {
      const el = within(view).getByTestId(`slot-${slot}`);
      expect(el).toBeInTheDocument();
      expect(el).toHaveAccessibleName(new RegExp(slot, 'i'));
      // Each slot is anchored to a named body region of the character layout.
      expect(el.closest('[data-region]')?.getAttribute('data-region')).toBeTruthy();
    }
  });

  it('shows the equipped item icon in its region-adjacent slot', async () => {
    await renderApp();
    act(() => {
      useInventoryStore.getState().equip(toItemId('iron-helm'), 'head');
    });
    const headSlot = within(screen.getByTestId('character-view')).getByTestId(
      'slot-head',
    );
    const tile = within(headSlot).getByTestId('item-iron-helm');
    expect(tile).toBeInTheDocument();
    expect(within(tile).getByText('🪖')).toBeInTheDocument();
    expect(within(tile).queryByText(/iron helm/i)).toBeNull();
  });
});
