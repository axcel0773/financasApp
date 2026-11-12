import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        primary: { DEFAULT: 'var(--primary)', dark: 'var(--primary-dark)', fg: 'var(--primary-fg)' },
        soft: 'var(--soft)',
        link: 'var(--link)',
        income: 'var(--income)',
        brass: 'var(--brass)',
        trip: 'var(--trip)',
        expense: { DEFAULT: 'var(--expense)', text: 'var(--expense-text)' },
        voucher: 'var(--voucher)',
        'ok-bg': 'var(--ok-bg)',
        'danger-bg': 'var(--danger-bg)',
      },
      borderRadius: { md: '14px', lg: '22px', xl: '26px', '2xl': '30px' },
      fontFamily: { display: ['var(--font-display)'], sans: ['var(--font-body)'] },
    },
  },
  plugins: [],
};
export default config;
