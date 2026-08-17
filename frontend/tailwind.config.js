/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FDFBF6',
          100: '#FAF5EC',
          200: '#F4ECDD',
          300: '#EDE1CC'
        },
        champagne: {
          50: '#FBF6EC',
          100: '#F6EDDB',
          200: '#EDDDB9',
          300: '#E2C88E',
          400: '#D4B06B',
          500: '#C9A24D',
          600: '#B8934F',
          700: '#9A7739',
          800: '#7A5D2E',
          900: '#5C4623'
        },
        espresso: {
          50: '#F7F4EF',
          100: '#EBE4D9',
          200: '#D6C9B4',
          300: '#B8A88B',
          400: '#988566',
          500: '#7A6A4F',
          600: '#5F5340',
          700: '#4A4134',
          800: '#3A3328',
          900: '#2B261D'
        },
        blush: '#F5E9E2',
        rosegold: '#C98C7C'
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
        script: ['"Great Vibes"', 'cursive']
      },
      letterSpacing: {
        luxury: '0.28em',
        wide2: '0.14em'
      },
      boxShadow: {
        gold: '0 8px 30px rgba(184,147,79,0.25)',
        goldSm: '0 4px 16px rgba(184,147,79,0.18)',
        card: '0 2px 20px rgba(43,38,29,0.06)',
        cardHover: '0 18px 45px rgba(43,38,29,0.14)'
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(120deg, #B8934F 0%, #DDBF7E 38%, #E8D29B 50%, #DDBF7E 62%, #B8934F 100%)',
        'champagne-radial': 'radial-gradient(circle at 20% 20%, #F6EDDB 0%, #EFE2C6 45%, #E4D2AE 100%)'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(2deg)' }
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        'kenburns': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.12)' }
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' }
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        'draw': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' }
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'zoom-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.8s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 1s ease both',
        shimmer: 'shimmer 3.2s linear infinite',
        float: 'float 7s ease-in-out infinite',
        marquee: 'marquee 32s linear infinite',
        kenburns: 'kenburns 18s ease-out infinite alternate',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 14s linear infinite',
        'slide-in-right': 'slide-in-right 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'zoom-in': 'zoom-in 0.45s cubic-bezier(0.22,1,0.36,1) both'
      }
    }
  },
  plugins: []
}
