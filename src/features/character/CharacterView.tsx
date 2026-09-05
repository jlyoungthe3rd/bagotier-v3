import type { CharacterAppearance, ItemId, SlotType } from '../../types/domain';
import { useCharacterQuery } from './useCharacterQuery';
import { useInventoryStore } from '../../store/useInventoryStore';
import { EquipmentSlot } from './EquipmentSlot';

/** Palette variants selected by the generated appearance parts (R9). */
const SKIN_TONES: Readonly<Record<string, string>> = {
  'skin-01': '#e8b88a',
  'skin-02': '#c68e5e',
  'skin-03': '#8d5a3b',
};

/** Layered SVG figure composed from the generated appearance parts. */
export function CharacterFigure({
  appearance,
}: {
  readonly appearance: CharacterAppearance;
}) {
  const skin = SKIN_TONES[appearance.parts.skin ?? ''] ?? '#e8b88a';

  return (
    <svg
      viewBox="0 0 100 220"
      role="img"
      aria-label="Generated character"
      focusable="false"
      className="h-52 w-auto drop-shadow-lg"
    >
      {/* legs */}
      <rect x="38" y="150" width="10" height="55" rx="5" fill={skin} />
      <rect x="52" y="150" width="10" height="55" rx="5" fill={skin} />
      {/* body */}
      <rect x="30" y="82" width="40" height="75" rx="14" fill={skin} />
      {/* arms */}
      <rect x="16" y="88" width="12" height="55" rx="6" fill={skin} />
      <rect x="72" y="88" width="12" height="55" rx="6" fill={skin} />
      {/* head */}
      <circle cx="50" cy="45" r="26" fill={skin} />
    </svg>
  );
}

function RegionSlot({
  slot,
  equipped,
}: {
  readonly slot: SlotType;
  readonly equipped: Readonly<Record<SlotType, ItemId | null>>;
}) {
  return <EquipmentSlot slot={slot} itemId={equipped[slot]} />;
}

/**
 * The generated character centerpiece with the seven equipment slots
 * spatially arranged by body region: head above, weapon/hands and
 * body/accessory flanking, legs and feet below (US5).
 */
export function CharacterView() {
  const { data: character } = useCharacterQuery();
  const equipped = useInventoryStore((s) => s.equipped);

  if (character === undefined) return null;

  return (
    <section
      aria-label={`Character ${character.name}`}
      data-testid="character-view"
      className="relative flex flex-col items-center gap-3"
    >
      <h2 className="font-display text-base font-bold text-gold">{character.name}</h2>
      <div data-region="head" className="flex justify-center">
        <RegionSlot slot="head" equipped={equipped} />
      </div>
      <div className="flex items-center gap-4">
        <div data-region="right-hand" className="flex flex-col gap-4">
          <RegionSlot slot="weapon" equipped={equipped} />
          <RegionSlot slot="hands" equipped={equipped} />
        </div>
        {/* Character figure with atmospheric summoning circle */}
        <div className="relative flex items-center justify-center">
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 200 220"
              aria-hidden="true"
              focusable="false"
              className="h-52 w-auto opacity-[0.18]"
            >
              {/* Outer spinning dashed ring */}
              <g
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                className="animate-spin-slow"
              >
                <circle
                  cx="100"
                  cy="110"
                  r="90"
                  fill="none"
                  stroke="#7c5fc7"
                  strokeWidth="0.6"
                  strokeDasharray="4 10"
                />
              </g>
              {/* Static inner ring */}
              <circle
                cx="100"
                cy="110"
                r="72"
                fill="none"
                stroke="#7c5fc7"
                strokeWidth="0.4"
              />
              {/* Gold rune marks at cardinal points */}
              <line
                x1="100"
                y1="30"
                x2="100"
                y2="42"
                stroke="#c4943a"
                strokeWidth="1.2"
              />
              <line
                x1="100"
                y1="178"
                x2="100"
                y2="190"
                stroke="#c4943a"
                strokeWidth="1.2"
              />
              <line
                x1="20"
                y1="110"
                x2="32"
                y2="110"
                stroke="#c4943a"
                strokeWidth="1.2"
              />
              <line
                x1="168"
                y1="110"
                x2="180"
                y2="110"
                stroke="#c4943a"
                strokeWidth="1.2"
              />
              {/* Center orb */}
              <circle
                cx="100"
                cy="110"
                r="3"
                fill="none"
                stroke="#c4943a"
                strokeWidth="0.8"
              />
            </svg>
          </div>
          <CharacterFigure appearance={character.appearance} />
        </div>
        <div data-region="torso" className="flex flex-col gap-4">
          <RegionSlot slot="body" equipped={equipped} />
          <RegionSlot slot="accessory" equipped={equipped} />
        </div>
      </div>
      <div data-region="lower-body" className="flex justify-center gap-4">
        <RegionSlot slot="legs" equipped={equipped} />
        <RegionSlot slot="feet" equipped={equipped} />
      </div>
    </section>
  );
}
