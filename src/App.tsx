import { useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
} from '@dnd-kit/core';
import { useInventoryQuery, useItem } from './features/inventory/useInventoryQuery';
import { useCharacterQuery } from './features/character/useCharacterQuery';
import { registerItemSlotTypes, useInventoryStore } from './store/useInventoryStore';
import { InvalidFlashProvider, useInventoryDnd } from './features/inventory/dnd';
import { InventoryGrid } from './features/inventory/InventoryGrid';
import { ItemTilePreview } from './features/inventory/InventoryItem';
import { ItemTooltipProvider } from './features/inventory/tooltip';
import { CharacterView } from './features/character/CharacterView';
import { StatPanel } from './features/character/StatPanel';
import { MuteToggle } from './features/audio/MuteToggle';
import type { Item } from './types/domain';

/** Pointer position first, overlay-rect intersection as keyboard fallback. */
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
};

const announcements: Announcements = {
  onDragStart: ({ active }) => `Picked up ${String(active.id)}.`,
  onDragOver: ({ active, over }) =>
    over !== null
      ? `${String(active.id)} is over ${String(over.id)}.`
      : `${String(active.id)} is no longer over a drop target.`,
  onDragEnd: ({ active, over }) =>
    over !== null
      ? `${String(active.id)} was dropped on ${String(over.id)}.`
      : `${String(active.id)} was dropped.`,
  onDragCancel: ({ active }) => `Dragging ${String(active.id)} was cancelled.`,
};

/** Skeleton block used by the designed loading state (Constitution III). */
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-sm bg-surface-raised ${className}`} />;
}

function LoadingScreen() {
  return (
    <div aria-busy="true" aria-label="Loading inventory" className="mx-auto max-w-4xl p-6">
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="mb-6 h-6 w-40" />
      <div className="flex gap-6">
        <Skeleton className="h-96 w-1/2" />
        <Skeleton className="h-96 w-1/2" />
      </div>
      <Skeleton className="mt-6 h-56 w-full" />
    </div>
  );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md p-10 text-center">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ember">
        Error
      </p>
      <h1 className="mb-2 font-display text-xl font-bold text-ink">
        The summoning failed
      </h1>
      <p className="mb-6 text-sm text-ink-muted">
        We couldn&apos;t load your character or items. Please try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded border border-ember/60 px-5 py-2 text-sm font-semibold text-ink transition-colors hover:border-ember hover:text-ember focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid"
      >
        Try again
      </button>
    </div>
  );
}

/** Seeds the session store from the fetched catalog exactly once per load. */
function useSeedStore(items: readonly Item[] | undefined) {
  const seedBag = useInventoryStore((s) => s.seedBag);
  useEffect(() => {
    if (items === undefined) return;
    registerItemSlotTypes(
      Object.fromEntries(items.map((i) => [i.id, i.slotType])),
    );
    seedBag(items.map((i) => i.id));
  }, [items, seedBag]);
}

function DragPreview() {
  const activeDrag = useInventoryStore((s) => s.activeDrag);
  const item = useItem(activeDrag?.itemId ?? null);
  return (
    <DragOverlay className="drag-overlay">
      {item !== undefined ? <ItemTilePreview item={item} /> : null}
    </DragOverlay>
  );
}

function InventoryScreen() {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
  const dnd = useInventoryDnd();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={{ announcements }}
      autoScroll={false}
      onDragStart={dnd.onDragStart}
      onDragEnd={dnd.onDragEnd}
      onDragCancel={dnd.onDragCancel}
    >
      <InvalidFlashProvider value={dnd.invalidFlash}>
        <ItemTooltipProvider>
          {/* On sm+ the layout locks to viewport height with no page scroll. */}
          <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4 sm:h-dvh sm:gap-5 sm:overflow-hidden sm:px-6 sm:py-5">
            <header className="flex shrink-0 items-center border-b border-slot-idle/40 pb-4">
              <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">
                Bagotier
              </h1>
            </header>

            {/* Body: inventory bag left, paper doll + stat block right */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 sm:flex-row sm:gap-6">

              {/* Left column: inventory bag */}
              <div className="shrink-0 rounded border border-slot-idle/40 bg-surface-raised/60 p-3 sm:p-4">
                <InventoryGrid />
              </div>

              {/* Right column: paper doll on top, stat block spanning full width below */}
              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-1 items-center justify-center rounded border border-slot-idle/40 bg-surface-raised/60 p-3 sm:p-4">
                  <CharacterView />
                </div>
                <StatPanel />
              </div>
            </div>

            {dnd.feedback !== null ? (
              <div
                role="status"
                className="flex shrink-0 items-center justify-between rounded border border-slot-invalid/50 bg-surface-raised px-4 py-2.5 text-sm text-ink-muted"
              >
                <span>{dnd.feedback}</span>
                <button
                  type="button"
                  onClick={dnd.dismissFeedback}
                  className="ml-4 text-xs font-semibold uppercase tracking-wide text-ink-muted underline hover:text-ink"
                >
                  Dismiss
                </button>
              </div>
            ) : null}

            <MuteToggle />
          </main>
        </ItemTooltipProvider>
      </InvalidFlashProvider>
      <DragPreview />
    </DndContext>
  );
}

export default function App() {
  const itemsQuery = useInventoryQuery();
  const characterQuery = useCharacterQuery();
  useSeedStore(itemsQuery.data);

  if (itemsQuery.isError || characterQuery.isError) {
    return (
      <ErrorScreen
        onRetry={() => {
          void itemsQuery.refetch();
          void characterQuery.refetch();
        }}
      />
    );
  }

  if (itemsQuery.isPending || characterQuery.isPending) {
    return <LoadingScreen />;
  }

  return <InventoryScreen />;
}
