import { useState } from 'react';

export function WipBanner() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <aside
      role="region"
      aria-label="Work in progress notice"
      aria-hidden={dismissed ? true : undefined}
      className={`flex items-center justify-between gap-3 rounded border border-gold/40 bg-surface-raised/90 px-3 py-1.5 text-xs text-ink shadow-sm backdrop-blur-sm transition-all duration-300 sm:px-4 sm:py-2 ${
        dismissed
          ? 'pointer-events-none invisible h-0 overflow-hidden border-transparent py-0 opacity-0 sm:py-0'
          : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex items-center justify-center rounded bg-gold/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gold border border-gold/40"
          aria-hidden="true"
        >
          WIP
        </span>
        <span className="font-medium text-ink-muted sm:text-xs">
          Work in Progress &mdash; Features under active development.
        </span>
      </div>
      <button
        type="button"
        tabIndex={dismissed ? -1 : undefined}
        onClick={() => setDismissed(true)}
        aria-label="Dismiss work in progress notice"
        className="ml-2 rounded p-1 text-ink-muted transition-colors hover:bg-slot-idle/60 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </aside>
  );
}
