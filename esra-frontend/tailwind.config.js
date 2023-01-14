/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '560px',
        'rxs': {'raw': '(max-width: 560px)'},
        'short': {'raw': '(max-height: 840px)'},
        'show-logo': '1100px',
      }
    },
  },
  plugins: [],
}
