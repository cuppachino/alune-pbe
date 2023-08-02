/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', 'src/renderer/src/**/*.tsx'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter var', 'sans-serif']
      }
    }
  },
  plugins: [
    ({ addUtilities }) => {
      addUtilities({
        '.app-region-drag': {
          '-webkit-user-select': 'none',
          '-webkit-app-region': 'drag'
        },
        '.app-region-auto': {
          '-webkit-user-select': 'auto',
          '-webkit-app-region': 'no-drag'
        }
      })
    }
  ]
}
