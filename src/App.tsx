import { useEffect } from 'react';
import { useInventoryQuery } from './features/inventory/useInventoryQuery';
import { useCharacterQuery } from './features/character/useCharacterQuery';
import { registerItemSlotTypes, useInventoryStore } from './store/useInventoryStore';
import { ItemTooltipProvider } from './features/inventory/tooltip';
import { CharacterView } from './features/character/CharacterView';
import { StatPanel } from './features/character/StatPanel';
import { MuteToggle } from './features/audio/MuteToggle';
import { GitHubLink } from './features/github/GitHubLink';
import { WipBanner } from './features/banner/WipBanner';
import type { Item } from './types/domain';

/** Skeleton block used by the designed loading state (Constitution III). */
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-sm bg-surface-raised ${className}`} />;
}

function LoadingScreen() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading inventory"
      className="mx-auto max-w-2xl px-4 pb-6 pt-14 sm:px-6 sm:pb-8 sm:pt-16"
    >
      <Skeleton className="mb-1 h-3 w-24" />
      <Skeleton className="mb-6 h-6 w-40" />
      <Skeleton className="mx-auto mb-4 h-64 w-56" />
      <Skeleton className="h-20 w-full" />
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
  const seedUnequipped = useInventoryStore((s) => s.seedUnequipped);
  useEffect(() => {
    if (items === undefined) return;
    registerItemSlotTypes(Object.fromEntries(items.map((i) => [i.id, i.slotType])));
    seedUnequipped(items.map((i) => i.id));
  }, [items, seedUnequipped]);
}

function InventoryScreen() {
  const feedback = useInventoryStore((s) => s.feedback);

  return (
    <ItemTooltipProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:border focus:border-gold focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gold focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Polite live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="a11y-live-region"
      >
        {feedback}
      </div>

      <MuteToggle />
      <GitHubLink />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-6 pt-14 focus:outline-none sm:px-6 sm:pb-8 sm:pt-16"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slot-idle/50 pb-4">
          <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">
            Bagotier
          </h1>
          <WipBanner />
        </header>

        {/* Paper doll — visual hero, centered */}
        <div className="flex w-full justify-center">
          <CharacterView />
        </div>

        {/* Separator */}
        <hr aria-hidden="true" className="border-0 border-t border-slot-idle/50" />

        {/* Stat panel */}
        <StatPanel />
      </main>
    </ItemTooltipProvider>
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
