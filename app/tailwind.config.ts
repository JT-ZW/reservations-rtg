import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Rainbow Towers Brand Colors
        rainbow: {
          red: '#E63946',
          orange: '#F77F00',
          yellow: '#FCBF49',
          green: '#06A77D',
          blue: '#1D3557',
          indigo: '#457B9D',
          violet: '#9D4EDD',
        },
        brand: {
          primary: '#1D3557',    // Deep professional blue
          secondary: '#457B9D',  // Light blue
          accent: '#FCBF49',     // Gold/Amber accent
          bronze: '#8B4513',     // RTG Bronze/Brown from logo
          success: '#06A77D',    // Green
          danger: '#E63946',     // Red
          dark: '#0A1128',       // Dark navy
          light: '#F1FAEE',      // Off-white
        },
      },
      backgroundImage: {
        'rainbow-gradient': 'linear-gradient(135deg, #E63946 0%, #F77F00 20%, #FCBF49 40%, #06A77D 60%, #457B9D 80%, #9D4EDD 100%)',
        'brand-gradient': 'linear-gradient(135deg, #1D3557 0%, #457B9D 100%)',
        'gold-gradient': 'linear-gradient(135deg, #FCBF49 0%, #F77F00 100%)',
        'subtle-gradient': 'linear-gradient(135deg, #F1FAEE 0%, #ffffff 100%)',
        'premium-gradient': 'linear-gradient(135deg, #1D3557 0%, #457B9D 50%, #FCBF49 100%)',
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(29, 53, 87, 0.2)',
        'rainbow': '0 8px 32px -8px rgba(252, 191, 73, 0.3)',
        'elevated': '0 20px 60px -15px rgba(29, 53, 87, 0.3)',
        'glow': '0 0 20px rgba(252, 191, 73, 0.4)',
      },
      animation: {
        'gradient': 'gradient 8s ease infinite',
        'fadeIn': 'fadeIn 0.5s ease-in',
        'slideUp': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
