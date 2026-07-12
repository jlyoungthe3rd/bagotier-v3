import { describe, expect, it } from 'vitest';
import { CharacterSchema, StatKeySchema } from '../../src/types/schemas';
import { character } from '../../src/mocks/character';

describe('character contract', () => {
  it('parses with CharacterSchema', () => {
    const result = CharacterSchema.safeParse(character);
    expect(result.success).toBe(true);
  });

  it('has every stat key present with a value ≥ 0', () => {
    for (const key of StatKeySchema.options) {
      const value = character.baseStats[key];
      expect(value).toBeTypeOf('number');
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });
});
