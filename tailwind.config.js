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
    'prettier-plugin-tailwindcss',
    ({ addUtilities }) => {
      addUtilities({
        '.app-region-drag': {
          'user-select': 'none',
          '-webkit-user-select': 'none',
          '-webkit-app-region': 'drag'
        },
        '.app-region-auto': {
          'user-select': 'auto',
          '-webkit-user-select': 'auto',
          '-webkit-app-region': 'no-drag'
        }
      })
    }
  ]
}
