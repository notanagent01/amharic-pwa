/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                ethiopic: ['Noto Sans Ethiopic', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
