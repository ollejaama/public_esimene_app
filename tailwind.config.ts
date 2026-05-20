import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        atlas: {
          bg:          'var(--atlas-bg)',
          panel:       'var(--atlas-panel)',
          ink:         'var(--atlas-ink)',
          muted:       'var(--atlas-muted)',
          faint:       'var(--atlas-faint)',
          rule:        'var(--atlas-rule)',
          accent:      'var(--atlas-accent)',
          accentSoft:  'var(--atlas-accent-soft)',
          selected:    'var(--atlas-selected)',
          selectedFg:  'var(--atlas-selected-fg)',
          z0: '#6b8aa3',
          z1: '#9ab48a',
          z2: '#7a9c66',
          z3: '#c6a24a',
          z4: '#c8703a',
          z5: 'var(--atlas-z5)',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        modal: '14px',
      },
    },
  },
  plugins: [],
};
export default config;
