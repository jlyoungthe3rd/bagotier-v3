import type { Config } from 'tailwindcss';

/**
 * Design tokens — "Forge & Rune" theme.
 *
 * Surfaces: void-black with warm rune-purple undertone.
 * Accent: ember orange (hot forge) as the primary interactive color.
 * Display: Cinzel serif + JetBrains Mono for stat data.
 *
 * WCAG 2.1 AA contrast on surface-sunken (#080610):
 * - slot-valid  (#56ad74) — contrast ≈ 7.5:1
 * - slot-invalid (#d94f4f) — contrast ≈ 5.8:1 (large text / interactive)
 * - ink (#e8ddd0)         — contrast ≈ 17:1
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#151020',
          raised: '#1f1930',
          sunken: '#080610',
        },
        'slot-idle': '#2e2545',
        'slot-valid': '#56ad74',
        'slot-invalid': '#d94f4f',
        buff: '#6ec87c',
        debuff: '#e06060',
        ember: '#d4683a',
        rune: '#7c5fc7',
        gold: '#c4943a',
        ink: {
          DEFAULT: '#e8ddd0',
          muted: '#7a7060',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      spacing: {
        cell: '3.5rem',
      },
      animation: {
        'spin-slow': 'spin 45s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
