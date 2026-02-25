/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                ethiopic: ['Noto Sans Ethiopic', 'system-ui', 'sans-serif'],
            },
            colors: {
                bg: '#0D0F12',
                surface: '#1C1E26',
                'surface-hover': '#2A2D39',
                primary: '#E63946',
                secondary: '#F4A261',
                text: '#F3F4F6',
                muted: '#9CA3AF',
                border: '#2D313E',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out forwards',
                'slide-up': 'slideUp 0.4s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}
