import type { Character, StatKey } from '../types/domain';

/** Deterministic PRNG keyed by the appearance seed (research.md R9). */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = ['Bagotier', 'Renn', 'Malva', 'Thorne', 'Isolde', 'Quill'] as const;
const SKINS = ['skin-01', 'skin-02', 'skin-03'] as const;
const HAIRS = ['hair-01', 'hair-02', 'hair-03', 'hair-04'] as const;
const FACES = ['face-01', 'face-02', 'face-03'] as const;

const STAT_RANGES: Readonly<Record<StatKey, readonly [number, number]>> = {
  hp: [40, 60],
  mp: [20, 40],
  def: [5, 15],
  str: [5, 15],
  agi: [5, 15],
  int: [5, 15],
};

function pick<T>(rand: () => number, options: readonly T[]): T {
  const value = options[Math.floor(rand() * options.length)];
  if (value === undefined) throw new Error('empty options');
  return value;
}

function rollStat(rand: () => number, range: readonly [number, number]): number {
  const [min, max] = range;
  return min + Math.floor(rand() * (max - min + 1));
}

/** Builds a generated character from a seed (deterministic per seed). */
export function generateCharacter(seed: number): Character {
  const rand = mulberry32(seed);
  return {
    id: 'player-1',
    name: pick(rand, NAMES),
    appearance: {
      seed,
      parts: {
        skin: pick(rand, SKINS),
        hair: pick(rand, HAIRS),
        face: pick(rand, FACES),
      },
    },
    baseStats: {
      hp: rollStat(rand, STAT_RANGES.hp),
      mp: rollStat(rand, STAT_RANGES.mp),
      def: rollStat(rand, STAT_RANGES.def),
      str: rollStat(rand, STAT_RANGES.str),
      agi: rollStat(rand, STAT_RANGES.agi),
      int: rollStat(rand, STAT_RANGES.int),
    },
  };
}

/** The session's generated character — randomized once per page load. */
export const character: Character = generateCharacter(
  Math.floor(Math.random() * 0xffffffff),
);
