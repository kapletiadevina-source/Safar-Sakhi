/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pastel Harmony Palette
        pastel: {
          pink: '#F8DDE5',        // Baby Pink: Primary dashboard cards & welcome
          pinkBorder: '#EEC5D1',
          pinkHover: '#F4CFDB',
          yellow: '#FFF0BD',      // Butter Yellow: Highlight cards & safety reminders
          yellowBorder: '#F5DC96',
          yellowHover: '#FDEBA6',
          blue: '#DCEFFA',        // Sky Blue: Journey and location sections
          blueBorder: '#C1E3F5',
          blueHover: '#CFE9F8',
          lavender: '#E8E0F7',    // Lavender: AI companion & secondary sections
          lavenderBorder: '#D6C8EE',
          lavenderHover: '#DED3F2',
          warmWhite: '#FFFCF8',   // Warm White: Main application background
          charcoal: '#494354',    // Soft Charcoal: Headings and readable text
          charcoalLight: '#6B6477', // Secondary readable text
          charcoalMuted: '#8E869B', // Muted text & captions
          emergency: '#DC2626',   // High-Visibility Red: Emergency SOS
          emergencyHover: '#B91C1C',
        },
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(73, 67, 84, 0.06), 0 2px 6px -2px rgba(73, 67, 84, 0.03)',
        'soft-md': '0 6px 24px -2px rgba(73, 67, 84, 0.08), 0 3px 8px -2px rgba(73, 67, 84, 0.04)',
        'soft-lg': '0 12px 30px -4px rgba(73, 67, 84, 0.10), 0 4px 12px -2px rgba(73, 67, 84, 0.04)',
        'emergency': '0 0 25px rgba(220, 38, 38, 0.45)',
      }
    },
  },
  plugins: [],
}


