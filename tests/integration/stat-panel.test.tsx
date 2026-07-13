import { describe, expect, it } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './dnd-test-utils';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { character } from '../../src/mocks/character';

/**
 * US2 — stat panel reflects base + equipped modifiers immediately.
 * iron-helm: { def: +5 }, steel-cuirass: { def: +9, hp: +4 }.
 */
describe('stat panel (US2)', () => {
  it('shows base stats initially', async () => {
    await renderApp();
    const panel = screen.getByTestId('stat-panel');
    expect(within(panel).getByTestId('stat-def')).toHaveTextContent(
      String(character.baseStats.def),
    );
    expect(within(panel).getByTestId('stat-hp')).toHaveTextContent(
      String(character.baseStats.hp),
    );
  });

  it('adds the equipped item bonus immediately and shows the delta breakdown', async () => {
    const user = userEvent.setup();
    await renderApp();

    const item = screen.getByTestId('item-iron-helm');
    await user.click(item);

    const def = screen.getByTestId('stat-def');
    expect(def).toHaveTextContent(String(character.baseStats.def + 5));
    expect(def).toHaveAttribute('data-delta', 'buff');
  });

  it('reverts to base after unequip', async () => {
    await renderApp();
    act(() => {
      useInventoryStore.getState().equip('iron-helm' as never, 'head');
      useInventoryStore.getState().unequip('head');
    });

    const def = screen.getByTestId('stat-def');
    expect(def).toHaveTextContent(String(character.baseStats.def));
  });

  it('sums bonuses across multiple equipped items', async () => {
    await renderApp();
    act(() => {
      useInventoryStore.getState().equip('iron-helm' as never, 'head'); // +5 def
      useInventoryStore.getState().equip('steel-cuirass' as never, 'body'); // +9 def, +4 hp
    });

    expect(screen.getByTestId('stat-def')).toHaveTextContent(
      String(character.baseStats.def + 14),
    );
    expect(screen.getByTestId('stat-hp')).toHaveTextContent(
      String(character.baseStats.hp + 4),
    );
  });

  it('marks negative totals as debuffs', async () => {
    await renderApp();
    // cursed-gauntlets: { str: +7, hp: -3 }
    act(() => {
      useInventoryStore.getState().equip('cursed-gauntlets' as never, 'hands');
    });

    const hp = screen.getByTestId('stat-hp');
    expect(hp).toHaveTextContent(String(character.baseStats.hp - 3));
    expect(hp).toHaveAttribute('data-delta', 'debuff');
  });
});
