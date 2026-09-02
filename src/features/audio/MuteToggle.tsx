import { useInventoryStore } from '../../store/useInventoryStore';

/** Accessible global mute control wired to the store (FR-010). */
export function MuteToggle() {
  const muted = useInventoryStore((s) => s.muted);
  const toggleMute = useInventoryStore((s) => s.toggleMute);

  return (
    <button
      type="button"
      aria-pressed={muted}
      aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
      onClick={toggleMute}
      className="fixed left-4 top-4 z-50 flex h-8 w-8 items-center justify-center rounded border border-slot-idle/60 bg-surface-raised/80 text-sm leading-none text-ink-muted backdrop-blur-sm transition-colors hover:border-ember/60 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid"
    >
      <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
    </button>
  );
}
