import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { renderApp } from './dnd-test-utils';
import { waitForTooltip } from './item-tooltip-test-utils';

describe('item tooltip placement behavior', () => {
  beforeEach(() => {
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1024,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 768,
      configurable: true,
    });
  });
  it('adds placement metadata and uses viewport-safe fallback placements', async () => {
    const user = userEvent.setup();
    await renderApp();

    act(() => {
      useInventoryStore.getState().equip('ruby-ring' as never, 'accessory');
    });

    await user.hover(screen.getByTestId('item-ruby-ring'));
    const tooltip = await waitForTooltip();

    expect(tooltip).toHaveAttribute('data-placement');
    expect(['right', 'left', 'top', 'bottom']).toContain(
      (tooltip.getAttribute('data-placement') ?? '').split('-')[0],
    );
  });

  it('positions tooltip to the left for right-fanning equipped slots (accessory, body)', async () => {
    const user = userEvent.setup();
    await renderApp();

    act(() => {
      useInventoryStore.getState().equip('ruby-ring' as never, 'accessory');
    });

    await user.hover(screen.getByTestId('item-ruby-ring'));
    const tooltip = await waitForTooltip();

    expect(tooltip.getAttribute('data-placement')).toBe('left');
  });

  it('positions tooltip to the right for left-fanning equipped slots (weapon, hands)', async () => {
    const user = userEvent.setup();
    await renderApp();

    act(() => {
      useInventoryStore.getState().equip('bronze-sword' as never, 'weapon');
    });

    await user.hover(screen.getByTestId('item-bronze-sword'));
    const tooltip = await waitForTooltip();

    expect(tooltip.getAttribute('data-placement')).toBe('right');
  });

  it('positions fan-out item tooltip to the right for left-fanning slot (weapon)', async () => {
    const user = userEvent.setup();
    await renderApp();

    act(() => {
      useInventoryStore.getState().setActiveFanoutSlot('weapon');
    });

    const fanoutItem = screen.getByTestId('fanout-item-bronze-sword');
    await user.hover(fanoutItem);

    const tooltip = await waitForTooltip();
    expect(tooltip).toHaveTextContent('Bronze Sword');
    expect(tooltip.getAttribute('data-placement')).toBe('right');
  });

  it('positions fan-out item tooltip to the left for right-fanning slot with viewport space (accessory)', async () => {
    const user = userEvent.setup();
    await renderApp();

    act(() => {
      useInventoryStore.getState().setActiveFanoutSlot('accessory');
    });

    const fanoutItem = screen.getByTestId('fanout-item-ruby-ring');
    await user.hover(fanoutItem);

    const tooltip = await waitForTooltip();
    expect(tooltip).toHaveTextContent('Ruby Ring');
    expect(tooltip.getAttribute('data-placement')).toBe('left');
  });

  it('flips preferred left tooltip to right when slot is at left viewport edge (head)', async () => {
    const user = userEvent.setup();
    await renderApp();

    act(() => {
      useInventoryStore.getState().setActiveFanoutSlot('head');
    });

    const fanoutItem = screen.getByTestId('fanout-item-iron-helm');
    await user.hover(fanoutItem);

    const tooltip = await waitForTooltip();
    expect(tooltip).toHaveTextContent('Iron Helm');
    // At x=0, preferred 'left' flips to 'right' via flip middleware fallbackPlacements
    expect(tooltip.getAttribute('data-placement')).toBe('right');
  });
});
