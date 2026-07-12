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
      className="fixed right-4 top-4 z-50 flex h-4 w-4 items-center justify-center rounded border border-slot-idle/60 text-[10px] leading-none text-ink-muted transition-colors hover:border-ember/60 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid"
    >
      <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
    </button>
  );
}
