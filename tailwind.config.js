/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				serif: ['EB Garamond', 'ui-serif', 'serif'],
				sans: ['Roboto', 'ui-sans-serif', 'sans-serif']
			},
			colors: {
				primary: {
					50: '#faf8f6',
					100: '#f5f1ed',
					200: '#eae2dc',
					300: '#dfd4cc',
					400: '#c9b5a0',
					500: '#a89989',
					600: '#7d6f65',
					700: '#5d5450',
					800: '#3e3835',
					900: '#2a2620'
				},
				cream: '#fafaf8',
				accent: '#c9a882',
				sage: '#9aa89a'
			},
			backgroundImage: {
				'gradient-warm': 'linear-gradient(135deg, #fafaf8 0%, #f5f1ed 100%)',
				'gradient-dark': 'linear-gradient(135deg, #5d5450 0%, #3e3835 100%)'
			},
			fontSize: {
				xs: ['0.75rem', { lineHeight: '1rem' }],
				sm: ['0.875rem', { lineHeight: '1.25rem' }],
				base: ['1rem', { lineHeight: '1.5rem' }],
				lg: ['1.125rem', { lineHeight: '1.75rem' }],
				xl: ['1.25rem', { lineHeight: '1.75rem' }],
				'2xl': ['1.5rem', { lineHeight: '2rem' }],
				'3xl': ['1.875rem', { lineHeight: '2.25rem' }],
				'4xl': ['2.25rem', { lineHeight: '2.5rem' }],
				'5xl': ['3rem', { lineHeight: '1.2' }]
			},
			spacing: {
				'safe-bottom': 'env(safe-area-inset-bottom)',
				'safe-top': 'env(safe-area-inset-top)'
			}
		}
	},
	plugins: []
};
