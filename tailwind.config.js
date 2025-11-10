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
					50: '#f8f5f0',
					100: '#f0ebe3',
					200: '#e1d7c7',
					300: '#d1c3ab',
					400: '#c2af8f',
					500: '#a68f6f',
					600: '#8a7359',
					700: '#6e5843',
					800: '#523d2f',
					900: '#3d2918'
				},
				cream: '#fdf9f5',
				gold: '#d4af37',
				sage: '#8b9a7f'
			},
			backgroundImage: {
				'gradient-warm': 'linear-gradient(135deg, #fdf9f5 0%, #f0ebe3 100%)',
				'gradient-dark': 'linear-gradient(135deg, #3d2918 0%, #523d2f 100%)'
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
