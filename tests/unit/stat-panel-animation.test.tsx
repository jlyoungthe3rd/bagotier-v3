import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { StatPanel } from '../../src/features/character/StatPanel';
import { registerItemSlotTypes, useInventoryStore } from '../../src/store/useInventoryStore';
import { character } from '../../src/mocks/character';
import { items } from '../../src/mocks/items';
import { queryKeys } from '../../src/lib/queryKeys';

const motionSpanCalls: Array<Record<string, unknown>> = [];

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    motion: new Proxy(actual.motion, {
      get(target, prop, receiver) {
        if (prop === 'span') {
          return (props: Record<string, unknown>) => {
            motionSpanCalls.push(props);
            const { initial, animate, transition, ...rest } = props;
            return createElement('span', rest);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    }),
  };
});

function setupStoreAndRender() {
  registerItemSlotTypes(Object.fromEntries(items.map((i) => [i.id, i.slotType])));
  useInventoryStore.getState().reset();
  useInventoryStore.getState().seedBag(items.map((i) => i.id));

  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  const view = render(
    createElement(QueryClientProvider, { client }, createElement(StatPanel)),
  );
  return { ...view, client };
}

describe('StatPanel transient highlight and grow animation', () => {
  beforeEach(() => {
    motionSpanCalls.length = 0;
  });

  it('renders initial stats with white initial color and grow animation targeting white', async () => {
    setupStoreAndRender();
    const statDef = await screen.findByTestId('stat-def');
    expect(statDef).toBeInTheDocument();

    const defCalls = motionSpanCalls.filter(
      (c) => (c['children'] as unknown) === character.baseStats.def,
    );
    expect(defCalls.length).toBeGreaterThan(0);
    const lastCall = defCalls[defCalls.length - 1];
    expect(lastCall).toBeDefined();
    expect(lastCall?.initial).toEqual({ scale: 1.25, color: '#ffffff' });
    expect(lastCall?.animate).toEqual({
      scale: [1.25, 1.0],
      color: ['#ffffff', '#ffffff', '#ffffff'],
    });
    expect(lastCall?.transition).toEqual({
      duration: 0.8,
      times: [0, 0.4, 1.0],
      ease: 'easeOut',
    });
  });

  it('triggers green transient highlight when a stat increases (buff) and reverts to white', async () => {
    const { client } = setupStoreAndRender();
    const statDef = await screen.findByTestId('stat-def');

    await waitFor(() => {
      expect(client.getQueryData(queryKeys.items)).toBeDefined();
    });

    const buffedDef = character.baseStats.def + 5;

    // Equip item that grants DEF (+5)
    act(() => {
      useInventoryStore.getState().equip('iron-helm' as never, 'head');
    });

    await waitFor(() => {
      expect(within(statDef).getByText(String(buffedDef))).toBeInTheDocument();
    });

    const defCalls = motionSpanCalls.filter(
      (c) => (c['children'] as unknown) === buffedDef,
    );
    expect(defCalls.length).toBeGreaterThan(0);
    const buffCall = defCalls.find((c) => (c.initial as Record<string, unknown>)?.color === '#6ec87c');
    expect(buffCall).toBeDefined();

    expect(buffCall?.initial).toEqual({ scale: 1.25, color: '#6ec87c' });
    expect(buffCall?.animate).toEqual({
      scale: [1.25, 1.0],
      color: ['#6ec87c', '#6ec87c', '#ffffff'],
    });
    expect(buffCall?.transition).toEqual({
      duration: 0.8,
      times: [0, 0.4, 1.0],
      ease: 'easeOut',
    });
  });

  it('triggers red transient highlight when a stat decreases (debuff) and reverts to white', async () => {
    const { client } = setupStoreAndRender();
    const statDef = await screen.findByTestId('stat-def');

    await waitFor(() => {
      expect(client.getQueryData(queryKeys.items)).toBeDefined();
    });

    const buffedDef = character.baseStats.def + 5;

    // First equip iron-helm (+5 DEF)
    act(() => {
      useInventoryStore.getState().equip('iron-helm' as never, 'head');
    });

    await waitFor(() => {
      expect(within(statDef).getByText(String(buffedDef))).toBeInTheDocument();
    });

    motionSpanCalls.length = 0;

    // Unequip iron-helm (-5 DEF)
    act(() => {
      useInventoryStore.getState().unequip('head');
    });

    await waitFor(() => {
      expect(within(statDef).getByText(String(character.baseStats.def))).toBeInTheDocument();
    });

    const defCalls = motionSpanCalls.filter(
      (c) => (c['children'] as unknown) === character.baseStats.def,
    );
    expect(defCalls.length).toBeGreaterThan(0);
    const debuffCall = defCalls.find((c) => (c.initial as Record<string, unknown>)?.color === '#e06060');
    expect(debuffCall).toBeDefined();

    expect(debuffCall?.initial).toEqual({ scale: 1.25, color: '#e06060' });
    expect(debuffCall?.animate).toEqual({
      scale: [1.25, 1.0],
      color: ['#e06060', '#e06060', '#ffffff'],
    });
    expect(debuffCall?.transition).toEqual({
      duration: 0.8,
      times: [0, 0.4, 1.0],
      ease: 'easeOut',
    });
  });
});
