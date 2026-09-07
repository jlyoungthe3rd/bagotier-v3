import { createElement, forwardRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as FramerMotion from 'framer-motion';
import {
  FanOut,
  computeFanPositions,
  DESKTOP_STEP,
  MOBILE_STEP,
  FAN_RADIUS_DESKTOP,
  FAN_RADIUS_MOBILE,
  SLOT_FAN_DIRECTION,
} from '../../src/features/character/FanOut';
import {
  ItemTooltipProvider,
  type TooltipPlacement,
} from '../../src/features/inventory/tooltip';
import { audioEngine } from '../../src/features/audio/useSound';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { items } from '../../src/mocks/items';
import type { Item, SlotType } from '../../src/types/domain';

interface RecordedMotionCall {
  initial: unknown;
  animate: unknown;
  exit: unknown;
  transition: unknown;
  childTestId?: string;
  childId?: string;
}

const mockUseReducedMotion = vi.fn<() => boolean | null>(() => false);
const motionDivCalls: RecordedMotionCall[] = [];

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof FramerMotion>('framer-motion');
  const ActualMotionDiv = actual.motion.div;
  const MockMotionDiv = forwardRef<HTMLDivElement, Record<string, unknown>>(
    (props, ref) => {
      const childProps = (
        props.children as { props?: Record<string, unknown> } | undefined
      )?.props;
      motionDivCalls.push({
        initial: props.initial,
        animate: props.animate,
        exit: props.exit,
        transition: props.transition,
        childTestId: childProps?.['data-testid'] as string | undefined,
        childId: childProps?.id as string | undefined,
      });
      return createElement(ActualMotionDiv, { ...props, ref });
    },
  );

  return {
    ...actual,
    useReducedMotion: () => mockUseReducedMotion(),
    motion: new Proxy(actual.motion, {
      get(target, prop) {
        if (prop === 'div') {
          return MockMotionDiv;
        }
        return target[prop as keyof typeof target];
      },
    }),
  };
});

const headItems = items.filter((i) => i.slotType === 'head');
const weaponItems = items.filter((i) => i.slotType === 'weapon');
const singleItem = [headItems[0]!];

function renderFanOut(
  props: {
    slot?: SlotType;
    items?: readonly Item[];
    slotElement?: HTMLElement | null;
    tooltipPlacement?: TooltipPlacement;
    onDismiss?: () => void;
  } = {},
) {
  const {
    slot = 'head',
    items: fanItems = headItems,
    slotElement,
    tooltipPlacement,
    onDismiss,
  } = props;
  return render(
    <ItemTooltipProvider>
      <FanOut
        slot={slot}
        items={fanItems}
        slotElement={slotElement}
        tooltipPlacement={tooltipPlacement}
        onDismiss={onDismiss}
      />
    </ItemTooltipProvider>,
  );
}

describe('FanOut component & computeFanPositions', () => {
  beforeEach(() => {
    window.innerWidth = 1024;
    mockUseReducedMotion.mockReturnValue(false);
    motionDivCalls.length = 0;

    useInventoryStore.getState().reset();
    useInventoryStore.getState().seedUnequipped(items.map((i) => i.id));
    useInventoryStore.getState().setActiveFanoutSlot('head');
  });

  describe('computeFanPositions', () => {
    it('returns empty array when count is 0 or negative', () => {
      expect(computeFanPositions('head', 0)).toEqual([]);
      expect(computeFanPositions('weapon', -2)).toEqual([]);
    });

    it('generates strictly horizontal coordinates with y = 0 for all slots', () => {
      const slots: SlotType[] = [
        'head',
        'body',
        'legs',
        'hands',
        'feet',
        'weapon',
        'accessory',
      ];
      for (const slot of slots) {
        const positions = computeFanPositions(slot, 3);
        expect(positions).toHaveLength(3);
        for (const pos of positions) {
          expect(pos.y).toBe(0);
        }
      }
    });

    describe('left-oriented slots (weapon, hands, legs)', () => {
      const leftSlots: SlotType[] = ['weapon', 'hands', 'legs'];

      it('verifies slot fan directions are configured to left', () => {
        for (const slot of leftSlots) {
          expect(SLOT_FAN_DIRECTION[slot]).toBe('left');
        }
      });

      it('generates negative x offsets stepping outward to the left (desktop)', () => {
        for (const slot of leftSlots) {
          const positions = computeFanPositions(slot, 3);
          expect(positions).toEqual([
            { x: -DESKTOP_STEP, y: 0 },
            { x: -2 * DESKTOP_STEP, y: 0 },
            { x: -3 * DESKTOP_STEP, y: 0 },
          ]);
        }
      });

      it('generates negative x offsets with MOBILE_STEP on mobile viewport', () => {
        for (const slot of leftSlots) {
          const positions = computeFanPositions(slot, 2, undefined, true);
          expect(positions).toEqual([
            { x: -MOBILE_STEP, y: 0 },
            { x: -2 * MOBILE_STEP, y: 0 },
          ]);
        }
      });
    });

    describe('right-oriented slots (head, body, accessory, feet)', () => {
      const rightSlots: SlotType[] = ['head', 'body', 'accessory', 'feet'];

      it('verifies slot fan directions are configured to right', () => {
        for (const slot of rightSlots) {
          expect(SLOT_FAN_DIRECTION[slot]).toBe('right');
        }
      });

      it('generates positive x offsets stepping outward to the right (desktop)', () => {
        for (const slot of rightSlots) {
          const positions = computeFanPositions(slot, 3);
          expect(positions).toEqual([
            { x: DESKTOP_STEP, y: 0 },
            { x: 2 * DESKTOP_STEP, y: 0 },
            { x: 3 * DESKTOP_STEP, y: 0 },
          ]);
        }
      });

      it('generates positive x offsets with MOBILE_STEP on mobile viewport', () => {
        for (const slot of rightSlots) {
          const positions = computeFanPositions(slot, 2, undefined, true);
          expect(positions).toEqual([
            { x: MOBILE_STEP, y: 0 },
            { x: 2 * MOBILE_STEP, y: 0 },
          ]);
        }
      });
    });

    describe('SLOT_FAN_DIRECTION tooltip placement mapping', () => {
      const allSlots: SlotType[] = [
        'head',
        'body',
        'legs',
        'hands',
        'feet',
        'weapon',
        'accessory',
      ];

      it('maps every slot type to either left or right fan direction', () => {
        for (const slot of allSlots) {
          expect(['left', 'right']).toContain(SLOT_FAN_DIRECTION[slot]);
        }
      });

      it('inverts left-fanning slots to right tooltip placement', () => {
        const leftSlots: SlotType[] = ['weapon', 'hands', 'legs'];
        for (const slot of leftSlots) {
          const tooltipPlacement =
            SLOT_FAN_DIRECTION[slot] === 'right' ? 'left' : 'right';
          expect(tooltipPlacement).toBe('right');
        }
      });

      it('inverts right-fanning slots to left tooltip placement', () => {
        const rightSlots: SlotType[] = ['head', 'body', 'accessory', 'feet'];
        for (const slot of rightSlots) {
          const tooltipPlacement =
            SLOT_FAN_DIRECTION[slot] === 'right' ? 'left' : 'right';
          expect(tooltipPlacement).toBe('left');
        }
      });
    });

    describe('custom step & legacy radius values', () => {
      it('uses custom step when non-default radius is passed', () => {
        const positions = computeFanPositions('weapon', 2, 80);
        expect(positions).toEqual([
          { x: -80, y: 0 },
          { x: -160, y: 0 },
        ]);
      });

      it('preserves backwards compatibility by mapping legacy FAN_RADIUS constants to standard steps', () => {
        const desktopPositions = computeFanPositions(
          'head',
          1,
          FAN_RADIUS_DESKTOP,
          false,
        );
        expect(desktopPositions).toEqual([{ x: DESKTOP_STEP, y: 0 }]);

        const mobilePositions = computeFanPositions('head', 1, FAN_RADIUS_MOBILE, true);
        expect(mobilePositions).toEqual([{ x: MOBILE_STEP, y: 0 }]);
      });
    });

    describe('center-fanning fallback behavior', () => {
      it('symmetrically flanks slot horizontally at y = 0 without placing item at x = 0', () => {
        // Mock a slot type that defaults to center
        const positions = computeFanPositions('unknown-slot' as unknown as SlotType, 3);
        // leftCount = floor(3 / 2) = 1
        // i = 0 (< 1): x = -(1 - 0) * 64 = -64
        // i = 1: x = (1 - 1 + 1) * 64 = 64
        // i = 2: x = (2 - 1 + 1) * 64 = 128
        expect(positions).toEqual([
          { x: -DESKTOP_STEP, y: 0 },
          { x: DESKTOP_STEP, y: 0 },
          { x: 2 * DESKTOP_STEP, y: 0 },
        ]);
      });
    });
  });

  describe('horizontal positioning & DOM rendering', () => {
    it('renders role="listbox" with aria-orientation="horizontal" and options for each item', () => {
      renderFanOut();

      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveAttribute('aria-orientation', 'horizontal');
      expect(listbox).toHaveAttribute(
        'aria-label',
        expect.stringMatching(/Available items for head slot/i),
      );
      expect(listbox).toHaveAttribute('aria-orientation', 'horizontal');

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveAttribute('data-testid', 'fanout-item-iron-helm');
      expect(options[1]).toHaveAttribute('data-testid', 'fanout-item-wizard-hat');

      // Intermediate motion.div wrapper has presentation role
      expect(options[0]?.parentElement).toHaveAttribute('role', 'presentation');

      // Option ARIA attributes
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(options[0]).toHaveAttribute('aria-setsize', '2');
      expect(options[0]).toHaveAttribute('aria-posinset', '1');
      expect(options[0]).toHaveAttribute('aria-label', 'Equip Iron Helm');
      expect(options[0]?.getAttribute('aria-describedby')).toContain(
        'fanout-instructions-head',
      );
      expect(options[0]).toHaveAttribute('tabindex', '0');

      expect(options[1]).toHaveAttribute('aria-selected', 'false');
      expect(options[1]).toHaveAttribute('aria-posinset', '2');
      expect(options[1]).toHaveAttribute('tabindex', '-1');
    });

    it('positions items with horizontal animation offsets (rightward for head slot)', () => {
      renderFanOut({ slot: 'head', items: headItems });

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);

      // Verify framer-motion props passed to each item wrapper
      const item0Call = motionDivCalls
        .filter((c) => c.childTestId === 'fanout-item-iron-helm')
        .at(-1);
      const item1Call = motionDivCalls
        .filter((c) => c.childTestId === 'fanout-item-wizard-hat')
        .at(-1);

      expect(item0Call?.animate).toEqual(
        expect.objectContaining({
          x: `calc(-50% + ${String(DESKTOP_STEP)}px)`,
          y: '-50%',
        }),
      );
      expect(item1Call?.animate).toEqual(
        expect.objectContaining({
          x: `calc(-50% + ${String(2 * DESKTOP_STEP)}px)`,
          y: '-50%',
        }),
      );
    });

    it('positions items with horizontal animation offsets (leftward for weapon slot)', () => {
      useInventoryStore.getState().setActiveFanoutSlot('weapon');
      renderFanOut({ slot: 'weapon', items: weaponItems });

      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThanOrEqual(1);

      const firstWeapon = weaponItems[0]!;
      const firstItemCall = motionDivCalls
        .filter((c) => c.childTestId === `fanout-item-${firstWeapon.id}`)
        .at(-1);

      expect(firstItemCall?.animate).toEqual(
        expect.objectContaining({
          x: `calc(-50% + -${String(DESKTOP_STEP)}px)`,
          y: '-50%',
        }),
      );
    });

    it('renders fallback icon when item icon is empty', () => {
      const firstHeadItem = headItems[0]!;
      const emptyIconItem: Item = {
        ...firstHeadItem,
        id: 'test-helm' as never,
        icon: '   ',
      };
      renderFanOut({ slot: 'head', items: [emptyIconItem] });

      const option = screen.getByRole('option');
      expect(option).toHaveTextContent('◻️');
    });
  });

  describe('viewport bounds clamping', () => {
    it('clamps rightward items to prevent overflow past right viewport edge', () => {
      // Mock container near right viewport edge on desktop (800px)
      const originalInnerWidth = window.innerWidth;
      window.innerWidth = 800;

      const getBoundingClientRectSpy = vi
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockReturnValue({
          width: 50,
          height: 50,
          top: 100,
          bottom: 150,
          left: 750,
          right: 800,
          x: 750,
          y: 100,
          toJSON: () => ({}),
        });

      // slotCenterX = 750 + 25 = 775
      // itemHalfSize = 28, margin = 12
      // maxRightAllowed = 800 - 12 = 788
      // For head slot item 0: base x = +64 -> itemRight = 775 + 64 + 28 = 867
      // 867 > 788, so x should be clamped to 788 - 775 - 28 = -15
      renderFanOut({ slot: 'head', items: [headItems[0]!] });

      const itemCall = motionDivCalls
        .filter((c) => c.childTestId === 'fanout-item-iron-helm')
        .at(-1);

      expect(itemCall?.animate).toEqual(
        expect.objectContaining({
          x: 'calc(-50% + -15px)',
          y: '-50%',
        }),
      );

      getBoundingClientRectSpy.mockRestore();
      window.innerWidth = originalInnerWidth;
    });

    it('clamps leftward items to prevent clipping past left viewport edge', () => {
      const originalInnerWidth = window.innerWidth;
      window.innerWidth = 800;

      // Mock container near left viewport edge
      const getBoundingClientRectSpy = vi
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockReturnValue({
          width: 50,
          height: 50,
          top: 100,
          bottom: 150,
          left: 10,
          right: 60,
          x: 10,
          y: 100,
          toJSON: () => ({}),
        });

      // slotCenterX = 10 + 25 = 35
      // itemHalfSize = 28, margin = 12
      // For weapon slot item 0: base x = -64 -> itemLeft = 35 - 64 - 28 = -57
      // -57 < 12, so x should be clamped by adding 12 - (-57) = 69 -> -64 + 69 = 5
      useInventoryStore.getState().setActiveFanoutSlot('weapon');
      renderFanOut({ slot: 'weapon', items: [weaponItems[0]!] });

      const weaponItem = weaponItems[0]!;
      const itemCall = motionDivCalls
        .filter((c) => c.childTestId === `fanout-item-${weaponItem.id}`)
        .at(-1);

      expect(itemCall?.animate).toEqual(
        expect.objectContaining({
          x: 'calc(-50% + 5px)',
          y: '-50%',
        }),
      );

      getBoundingClientRectSpy.mockRestore();
      window.innerWidth = originalInnerWidth;
    });

    it('safely retains base positions when container dimensions are 0 (headless)', () => {
      const getBoundingClientRectSpy = vi
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockReturnValue({
          width: 0,
          height: 0,
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        });

      renderFanOut({ slot: 'head', items: singleItem });

      const itemCall = motionDivCalls
        .filter((c) => c.childTestId === 'fanout-item-iron-helm')
        .at(-1);

      expect(itemCall?.animate).toEqual(
        expect.objectContaining({
          x: `calc(-50% + ${String(DESKTOP_STEP)}px)`,
          y: '-50%',
        }),
      );

      getBoundingClientRectSpy.mockRestore();
    });
  });

  describe('reduced motion behavior', () => {
    it('disables initial animation and uses zero-duration transitions when reduced motion is preferred', () => {
      mockUseReducedMotion.mockReturnValue(true);

      renderFanOut({ slot: 'head', items: headItems });

      const itemCall = motionDivCalls
        .filter((c) => c.childTestId === 'fanout-item-iron-helm')
        .at(-1);

      expect(itemCall?.initial).toBe(false);
      expect(itemCall?.transition).toEqual({
        duration: 0,
        ease: 'easeOut',
      });
      expect(itemCall?.exit).toEqual({
        opacity: 0,
        transition: { duration: 0 },
      });
    });

    it('uses standard scale and fade animation when reduced motion is not preferred', () => {
      mockUseReducedMotion.mockReturnValue(false);

      renderFanOut({ slot: 'head', items: headItems });

      const itemCall = motionDivCalls
        .filter((c) => c.childTestId === 'fanout-item-iron-helm')
        .at(-1);

      expect(itemCall?.initial).toEqual({
        scale: 0.8,
        opacity: 0,
        x: '-50%',
        y: '-50%',
      });
      expect(itemCall?.transition).toEqual({
        duration: 0.2,
        ease: 'easeOut',
      });
      expect(itemCall?.exit).toEqual({
        scale: 0.8,
        opacity: 0,
        x: '-50%',
        y: '-50%',
      });
    });
  });

  describe('keyboard navigation', () => {
    it('ArrowRight advances focused index and cycles back to start', async () => {
      const user = userEvent.setup();
      renderFanOut();

      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);

      await user.keyboard('{ArrowRight}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);

      // Wraps back to 0
      await user.keyboard('{ArrowRight}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);
    });

    it('ArrowDown advances focused index and cycles back to start', async () => {
      const user = userEvent.setup();
      renderFanOut();

      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);

      await user.keyboard('{ArrowDown}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);

      await user.keyboard('{ArrowDown}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);
    });

    it('ArrowLeft cycles backwards through items and wraps to end', async () => {
      const user = userEvent.setup();
      renderFanOut();

      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);

      // Backwards from 0 wraps to 1 (last item)
      await user.keyboard('{ArrowLeft}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);

      await user.keyboard('{ArrowLeft}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);
    });

    it('ArrowUp cycles backwards through items and wraps to end', async () => {
      const user = userEvent.setup();
      renderFanOut();

      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);

      await user.keyboard('{ArrowUp}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);

      await user.keyboard('{ArrowUp}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);
    });

    it('Home jumps focus to the first item (index 0)', async () => {
      const user = userEvent.setup();
      renderFanOut();

      act(() => {
        useInventoryStore.getState().setFocusedFanoutIndex(1);
      });
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);

      await user.keyboard('{Home}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);
    });

    it('End jumps focus to the last item', async () => {
      const user = userEvent.setup();
      renderFanOut();

      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);

      await user.keyboard('{End}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);
    });

    it('Enter key equips the selected item and closes fan-out', async () => {
      const user = userEvent.setup();
      const playbackSpy = vi.spyOn(audioEngine, 'playback');
      renderFanOut();

      // First item is iron-helm at index 0
      await user.keyboard('{Enter}');

      expect(useInventoryStore.getState().equipped.head).toBe('iron-helm');
      expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();
      expect(useInventoryStore.getState().feedback).toMatch(
        /Equipped Iron Helm to Head slot/i,
      );
      expect(playbackSpy).toHaveBeenCalledWith('equip');

      playbackSpy.mockRestore();
    });

    it('Space key equips the selected item and closes fan-out', async () => {
      const user = userEvent.setup();
      const playbackSpy = vi.spyOn(audioEngine, 'playback');
      renderFanOut();

      // Navigate to second item (wizard-hat)
      await user.keyboard('{ArrowRight}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);

      await user.keyboard(' ');

      expect(useInventoryStore.getState().equipped.head).toBe('wizard-hat');
      expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();
      expect(useInventoryStore.getState().feedback).toMatch(
        /Equipped Wizard Hat to Head slot/i,
      );
      expect(playbackSpy).toHaveBeenCalledWith('equip');

      playbackSpy.mockRestore();
    });

    it('Escape key dismisses the fan-out without equipping, announces to feedback store, and calls onDismiss', async () => {
      const user = userEvent.setup();
      const onDismissMock = vi.fn();
      renderFanOut({ onDismiss: onDismissMock });

      expect(useInventoryStore.getState().activeFanoutSlot).toBe('head');

      await user.keyboard('{Escape}');

      expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();
      expect(useInventoryStore.getState().equipped.head).toBeNull();
      expect(useInventoryStore.getState().feedback).toBe('Closed Head slot options.');
      expect(onDismissMock).toHaveBeenCalledTimes(1);
    });

    it('Tab key closes the active fan-out slot cleanly and announces to feedback store', async () => {
      const user = userEvent.setup();
      renderFanOut();

      expect(useInventoryStore.getState().activeFanoutSlot).toBe('head');

      await user.keyboard('{Tab}');

      expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();
      expect(useInventoryStore.getState().feedback).toBe('Closed Head slot options.');
    });

    it('Home and End keys jump to first and last items', async () => {
      const user = userEvent.setup();
      renderFanOut();

      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);

      await user.keyboard('{End}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);

      await user.keyboard('{Home}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);
    });
  });

  describe('click / equip action', () => {
    it('equips item on click, dismisses fan-out, and plays sound', async () => {
      const user = userEvent.setup();
      const playbackSpy = vi.spyOn(audioEngine, 'playback');
      renderFanOut();

      const wizardHatBtn = screen.getByTestId('fanout-item-wizard-hat');
      await user.click(wizardHatBtn);

      expect(useInventoryStore.getState().equipped.head).toBe('wizard-hat');
      expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();
      expect(playbackSpy).toHaveBeenCalledWith('equip');

      playbackSpy.mockRestore();
    });
  });

  describe('tooltip integration', () => {
    it('opens tooltip on hover and closes on leave', async () => {
      const user = userEvent.setup();
      renderFanOut();

      const itemBtn = screen.getByTestId('fanout-item-iron-helm');
      await user.hover(itemBtn);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Iron Helm');
      expect(itemBtn.getAttribute('aria-describedby')).toContain(tooltip.id);

      await user.unhover(itemBtn);
      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('opens tooltip on focus and updates focusedFanoutIndex', async () => {
      renderFanOut();

      const secondBtn = screen.getByTestId('fanout-item-wizard-hat');
      act(() => {
        secondBtn.focus();
      });

      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Wizard Hat');

      act(() => {
        secondBtn.blur();
      });
      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('renders tooltip with data-placement="left" when tooltipPlacement is "left" on hover', async () => {
      const user = userEvent.setup();
      const mockSlotEl = document.createElement('div');
      renderFanOut({ slotElement: mockSlotEl, tooltipPlacement: 'left' });

      const itemBtn = screen.getByTestId('fanout-item-iron-helm');
      await user.hover(itemBtn);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Iron Helm');
      expect(tooltip.getAttribute('data-placement')).toBe('left');
    });

    it('renders tooltip with data-placement="right" when tooltipPlacement is "right" on hover', async () => {
      const user = userEvent.setup();
      const mockSlotEl = document.createElement('div');
      renderFanOut({ slotElement: mockSlotEl, tooltipPlacement: 'right' });

      const itemBtn = screen.getByTestId('fanout-item-iron-helm');
      await user.hover(itemBtn);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Iron Helm');
      expect(tooltip.getAttribute('data-placement')).toBe('right');
    });

    it('renders tooltip with data-placement="left" when tooltipPlacement is "left" on focus', async () => {
      const mockSlotEl = document.createElement('div');
      renderFanOut({ slotElement: mockSlotEl, tooltipPlacement: 'left' });

      const secondBtn = screen.getByTestId('fanout-item-wizard-hat');
      act(() => {
        secondBtn.focus();
      });

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Wizard Hat');
      expect(tooltip.getAttribute('data-placement')).toBe('left');
    });

    it('renders tooltip with data-placement="right" when tooltipPlacement is "right" on focus', async () => {
      const mockSlotEl = document.createElement('div');
      renderFanOut({ slotElement: mockSlotEl, tooltipPlacement: 'right' });

      const secondBtn = screen.getByTestId('fanout-item-wizard-hat');
      act(() => {
        secondBtn.focus();
      });

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Wizard Hat');
      expect(tooltip.getAttribute('data-placement')).toBe('right');
    });
  });
});
