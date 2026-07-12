import { useQuery } from '@tanstack/react-query';
import { fetchCharacter } from '../../mocks/api';
import { queryKeys } from '../../lib/queryKeys';

/** Fetches the generated character (identity, appearance, base stats). */
export function useCharacterQuery() {
  return useQuery({
    queryKey: queryKeys.character,
    queryFn: fetchCharacter,
  });
}
