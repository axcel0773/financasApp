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
        primary: { DEFAULT: 'var(--primary)', dark: 'var(--primary-dark)' },
        expense: { DEFAULT: 'var(--expense)', text: 'var(--expense-text)' },
        voucher: 'var(--voucher)',
        'ok-bg': 'var(--ok-bg)',
        'danger-bg': 'var(--danger-bg)',
      },
      borderRadius: { md: '12px', lg: '16px', xl: '20px', '2xl': '24px' },
      fontFamily: { display: ['var(--font-display)'], sans: ['var(--font-body)'] },
    },
  },
  plugins: [],
};
export default config;
