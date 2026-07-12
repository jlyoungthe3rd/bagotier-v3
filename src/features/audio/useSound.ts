import { useCallback } from 'react';
import type { SoundEffectId } from './sounds';
import { SOUND_EFFECT_IDS, SOUND_EFFECTS } from './sounds';
import { useInventoryStore } from '../../store/useInventoryStore';

let ctx: AudioContext | null = null;
const buffers = new Map<SoundEffectId, AudioBuffer>();
let preloadPromise: Promise<void> | null = null;

function getContext(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/**
 * Preloads and decodes all effects into AudioBuffers (research.md R7).
 * Idempotent; safe to call on every user gesture. Silently no-ops when the
 * Web Audio API is unavailable (autoplay-restriction edge case).
 */
export function preloadSounds(): Promise<void> {
  preloadPromise ??= (async () => {
    const context = getContext();
    if (context === null) {
      preloadPromise = null;
      return;
    }
    await Promise.all(
      SOUND_EFFECT_IDS.map(async (id) => {
        try {
          const response = await fetch(SOUND_EFFECTS[id].src);
          if (!response.ok) return;
          const encoded = await response.arrayBuffer();
          buffers.set(id, await context.decodeAudioData(encoded));
        } catch {
          // Missing/undecodable asset → that effect stays silent.
        }
      }),
    );
  })();
  return preloadPromise;
}

/**
 * The low-level playback boundary. Kept as an object so tests can spy on
 * exactly-once playback without touching Web Audio internals.
 */
export const audioEngine = {
  /** Plays a decoded effect on a fresh AudioBufferSourceNode (rapid-fire safe). */
  playback(effect: SoundEffectId): void {
    const context = getContext();
    if (context === null) return;
    void preloadSounds();
    const buffer = buffers.get(effect);
    if (buffer === undefined) return; // not loaded yet → silent no-op
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start();
  },
};

/** Resets module audio state between unit tests. */
export function __resetAudioForTests(): void {
  ctx = null;
  buffers.clear();
  preloadPromise = null;
}

/**
 * Idempotent playback hook: returns a stable `play(effect)` that honors the
 * store's mute flag (FR-010) and degrades gracefully before the first user
 * gesture creates the AudioContext.
 */
export function useSound(): (effect: SoundEffectId) => void {
  return useCallback((effect: SoundEffectId) => {
    if (useInventoryStore.getState().muted) return;
    audioEngine.playback(effect);
  }, []);
}
