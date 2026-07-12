import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

/**
 * Web Audio mock stub — jsdom does not implement AudioContext.
 * The most recently constructed instance is exposed on
 * `globalThis.__lastAudioContext` for assertions.
 */
export class TestAudioContext {
  state = 'running';
  destination = {};
  resume = vi.fn(() => Promise.resolve());
  decodeAudioData = vi.fn(() => Promise.resolve({} as AudioBuffer));
  createBufferSource = vi.fn(() => ({
    buffer: null as AudioBuffer | null,
    connect: vi.fn(),
    start: vi.fn(),
  }));

  constructor() {
    (globalThis as Record<string, unknown>).__lastAudioContext = this;
  }
}

vi.stubGlobal('AudioContext', TestAudioContext);

// jsdom cannot fetch local assets; always stub for audio preloading.
vi.stubGlobal(
  'fetch',
  vi.fn(() =>
    Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as Response),
  ),
);
