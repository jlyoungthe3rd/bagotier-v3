import type { Character, Item } from '../types/domain';
import { character } from './character';
import { items } from './items';

const SIMULATED_LATENCY_MS = 150;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetches the immutable item catalog (simulated ~150 ms latency). */
export async function fetchItems(): Promise<readonly Item[]> {
  await delay(SIMULATED_LATENCY_MS);
  return items;
}

/** Fetches the generated character (simulated ~150 ms latency). */
export async function fetchCharacter(): Promise<Character> {
  await delay(SIMULATED_LATENCY_MS);
  return character;
}
