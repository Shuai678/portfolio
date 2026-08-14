import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", 'sans-serif'],
        playfair: ["'Playfair Display'", 'serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      colors: {
        graphite: '#050505',
        ember: '#e8702a',
        signal: '#7CFFB2',
      },
      boxShadow: {
        ember: '0 18px 80px rgba(232, 112, 42, 0.16)',
      },
    },
  },
  plugins: [],
} satisfies Config;
