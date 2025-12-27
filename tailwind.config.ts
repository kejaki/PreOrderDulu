import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // User defined palette
                background: '#F8F9FA',
                primary: {
                    DEFAULT: '#FF6B6B', // Coral Red
                    50: '#fff1f1',
                    100: '#ffdfdf',
                    200: '#ffc5c5',
                    300: '#ff9d9d',
                    400: '#ff6b6b',
                    500: '#fa4545',
                    600: '#e52828',
                    700: '#c21b1b',
                    800: '#a01b1b',
                    900: '#841d1d',
                    foreground: '#ffffff',
                },
                secondary: {
                    DEFAULT: '#2C3E50', // Navy Slate
                    50: '#f4f6f7',
                    100: '#e3e7eb',
                    200: '#c5d0d8',
                    300: '#9cadbc',
                    400: '#72889c',
                    500: '#566d82',
                    600: '#435669',
                    700: '#364554',
                    800: '#2c3e50', // Base
                    900: '#263442',
                    foreground: '#ffffff',
                },
                accent: {
                    DEFAULT: '#F1C40F', // Golden Yellow
                    50: '#fefce8',
                    100: '#fef9c3',
                    200: '#fef08a',
                    300: '#fde047',
                    400: '#facc15',
                    500: '#eab308',
                    600: '#ca8a04',
                    700: '#a16207',
                    800: '#854d0e',
                    900: '#713f12',
                    foreground: '#2C3E50',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
};
export default config;
