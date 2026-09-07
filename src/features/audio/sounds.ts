/**
 * Typed sound registry — one distinct effect per main interaction (FR-009).
 * Assets are self-generated public-domain WAV tones in `public/sounds/`.
 */
export const SOUND_EFFECT_IDS = ['pickup', 'equip', 'unequip'] as const;

export type SoundEffectId = (typeof SOUND_EFFECT_IDS)[number];

export interface SoundEffect {
  readonly id: SoundEffectId;
  readonly src: string;
}

export const SOUND_EFFECTS: Readonly<Record<SoundEffectId, SoundEffect>> = {
  pickup: { id: 'pickup', src: '/sounds/pickup.wav' },
  equip: { id: 'equip', src: '/sounds/equip.wav' },
  unequip: { id: 'unequip', src: '/sounds/unequip.wav' },
};
