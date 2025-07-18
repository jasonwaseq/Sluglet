import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f7faff', // very light blue
        surface: '#ffffff',    // white
        primary: {
          DEFAULT: '#a5b4fc', // pastel indigo
          dark: '#818cf8',
        },
        accent: {
          DEFAULT: '#fcd5ce', // peachy pastel
          dark: '#f8c1b0',
        },
        success: '#b9fbc0',   // mint pastel
        warning: '#fff3cd',   // pastel yellow
        muted: '#e0e7ef',     // light gray-blue
        text: '#3a3a3a',      // soft dark gray
      },
    },
  },
  plugins: [],
}
export default config 