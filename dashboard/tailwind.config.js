/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1a1a2e',
        accent: '#e94560',
        background: '#0f3460',
        card: '#16213e'
      }
    }
  },
  plugins: []
};
