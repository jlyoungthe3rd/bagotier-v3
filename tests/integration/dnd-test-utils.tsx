/**
 * Test utilities for exercising real dnd-kit wiring in jsdom.
 *
 * jsdom has no layout, so we assign deterministic rects to droppables and
 * draggables by test id. The dnd-kit KeyboardSensor moves the drag overlay
 * 25px per arrow press, letting tests navigate between rects predictably.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import App from '../../src/App';
import { items } from '../../src/mocks/items';
import { useInventoryStore } from '../../src/store/useInventoryStore';

export const KEYBOARD_STEP = 25;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const SLOT_ORDER = [
  'head',
  'body',
  'legs',
  'hands',
  'feet',
  'weapon',
  'accessory',
] as const;

/** Slots on one row at y=0; bag cells in rows of 6 starting at y=200. */
export function expectedRect(testId: string): Rect | null {
  const slotIndex = SLOT_ORDER.findIndex((s) => testId === `slot-${s}`);
  if (slotIndex !== -1) {
    return { x: slotIndex * 100, y: 0, width: 80, height: 80 };
  }
  const cellMatch = /^cell-(\d+)$/.exec(testId);
  if (cellMatch?.[1] !== undefined) {
    const i = Number(cellMatch[1]);
    return { x: (i % 6) * 100, y: 200 + Math.floor(i / 6) * 100, width: 80, height: 80 };
  }
  return null;
}

function toDomRect(rect: Rect): DOMRect {
  return {
    ...rect,
    top: rect.y,
    left: rect.x,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
    toJSON: () => rect,
  };
}

/** The initial rect of the currently picked-up item (drives overlay measuring). */
let pickedRect: Rect | null = null;

const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

/**
 * Global measurement patch: droppables/draggables report their deterministic
 * layout rect; the DragOverlay reports the picked item's initial rect
 * (dnd-kit applies keyboard deltas on top of it).
 */
export function installLayout(): void {
  Element.prototype.getBoundingClientRect = function (this: Element): DOMRect {
    const testId = this.getAttribute('data-testid');
    if (testId !== null) {
      const rect = expectedRect(testId);
      if (rect !== null) return toDomRect(rect);
      if (testId.startsWith('item-')) {
        const host = this.closest<HTMLElement>(
          '[data-testid^="cell-"], [data-testid^="slot-"]',
        );
        const hostId = host?.getAttribute('data-testid');
        if (hostId != null) {
          const hostRect = expectedRect(hostId);
          if (hostRect !== null) return toDomRect(hostRect);
        }
      }
    }
    if (this.closest('.drag-overlay') !== null && pickedRect !== null) {
      return toDomRect(pickedRect);
    }
    return originalGetBoundingClientRect.call(this);
  };
}

/** Renders the full app inside a fresh QueryClient and waits for data. */
export async function renderApp() {
  installLayout();
  pickedRect = null;
  useInventoryStore.getState().reset();
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  const view = render(createElement(QueryClientProvider, { client }, createElement(App)));
  await waitFor(() => {
    expect(screen.getByTestId('character-view')).toBeInTheDocument();
  });
  return view;
}

/** Presses an arrow key `count` times (25px per press). */
export async function arrow(
  user: ReturnType<typeof userEvent.setup>,
  key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight',
  count: number,
): Promise<void> {
  for (let i = 0; i < count; i++) {
    await user.keyboard(`{${key}}`);
  }
}

/**
 * Picks up a draggable via the keyboard sensor: focus + Enter.
 * Records the item's rect so the DragOverlay measures correctly.
 */
export async function pickUp(
  user: ReturnType<typeof userEvent.setup>,
  itemTestId: string,
): Promise<void> {
  const item = screen.getByTestId(itemTestId);
  const host = item.closest<HTMLElement>(
    '[data-testid^="cell-"], [data-testid^="slot-"]',
  );
  const hostId = host?.getAttribute('data-testid');
  pickedRect = hostId != null ? expectedRect(hostId) : null;
  item.focus();
  await user.keyboard(' ');
}

/**
 * Overrides a mock item icon for deterministic fallback-render testing.
 * Returns a restore callback that must be called by the test.
 */
export function overrideMockItemIcon(itemId: string, icon: string): () => void {
  const item = items.find((candidate) => candidate.id === itemId);
  if (item === undefined) {
    throw new Error(`Item not found for icon override: ${itemId}`);
  }
  const mutable = item as { icon: string };
  const original = mutable.icon;
  mutable.icon = icon;
  return () => {
    mutable.icon = original;
  };
}
