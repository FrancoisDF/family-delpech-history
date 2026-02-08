import type { Meta, StoryObj } from '@storybook/svelte';
import HeroBlock from './HeroBlock.svelte';

const meta = {
	title: 'Builder Components/HeroBlock',
	component: HeroBlock,
	tags: ['autodocs'],
	argTypes: {
		title: {
			control: 'text',
			description: 'Hero title text'
		},
		description: {
			control: 'text',
			description: 'Hero description text'
		},
		variant: {
			control: 'select',
			options: ['grayscale', 'color', 'image-focus'],
			description: 'Visual variant'
		},
		primaryButtonText: {
			control: 'text',
			description: 'Primary button text'
		},
		primaryButtonLink: {
			control: 'text',
			description: 'Primary button link'
		},
		secondaryButtonText: {
			control: 'text',
			description: 'Secondary button text'
		},
		secondaryButtonLink: {
			control: 'text',
			description: 'Secondary button link'
		},
		backgroundImage: {
			control: 'text',
			description: 'Background image URL'
		},
		backgroundImageDisplayMode: {
			control: 'select',
			options: ['cover', 'contain'],
			description: 'Background image display mode'
		}
	}
} satisfies Meta<HeroBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: 'Histoire de Famille',
		description: 'Discover the stories and history of your family',
		primaryButtonText: 'Explore',
		primaryButtonLink: '/',
		secondaryButtonText: 'Learn More',
		secondaryButtonLink: '/',
		variant: 'grayscale'
	}
};

export const WithBackground: Story = {
	args: {
		title: 'Familia Delpech',
		description: 'Un voyage à travers le temps et les générations',
		primaryButtonText: 'Commencer',
		primaryButtonLink: '/',
		secondaryButtonText: 'En savoir plus',
		secondaryButtonLink: '/',
		variant: 'color',
		backgroundImage:
			'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop'
	}
};

export const Minimal: Story = {
	args: {
		title: 'Welcome',
		description: 'Your family history awaits',
		primaryButtonText: 'Get Started',
		primaryButtonLink: '/',
		secondaryButtonText: '',
		secondaryButtonLink: '/',
		variant: 'grayscale'
	}
};
