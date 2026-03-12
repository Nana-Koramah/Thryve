/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // TSA core colors
        'tsa-navy': '#0f172a',
        'tsa-surface': '#f3f5fb',
        'tsa-accent-blue': '#2563eb',
        'tsa-accent-pink': '#F9A8D4',
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 8px 24px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
}

