import type { Meta, StoryObj } from '@storybook/sveltekit';
import HeroBlock from './HeroBlock.svelte';

const meta = {
	title: 'Builder Components/HeroBlock',
	component: HeroBlock,
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen' },
	argTypes: {
		title: { control: 'text' },
		description: { control: 'text' },
		variant: { control: 'select', options: ['grayscale', 'color', 'image-focus'] },
		primaryButtonText: { control: 'text' },
		primaryButtonLink: { control: 'text' },
		secondaryButtonText: { control: 'text' },
		secondaryButtonLink: { control: 'text' },
		backgroundImage: { control: 'text' },
		backgroundImageDisplayMode: { control: 'select', options: ['cover', 'contain'] }
	}
} satisfies Meta<typeof HeroBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const actions = {
	primaryButtonText: 'Explorer',
	primaryButtonLink: '/histoires',
	secondaryButtonText: 'En savoir plus',
	secondaryButtonLink: '/a-propos'
};

export const Default: Story = {
	args: {
		title: 'Histoire de famille',
		description: 'Découvrez les histoires et les archives de votre famille.',
		...actions,
		variant: 'grayscale',
		backgroundImage: '',
		backgroundImageDisplayMode: 'cover'
	}
};

export const WithBackground: Story = {
	args: {
		title: 'Familia Delpech',
		description: 'Un voyage à travers le temps et les générations.',
		...actions,
		variant: 'color',
		backgroundImage: '/logo-ddf.png',
		backgroundImageDisplayMode: 'contain'
	}
};

export const ImageFocus: Story = {
	args: {
		title: 'Les archives prennent vie',
		description: 'Un patrimoine à découvrir et à transmettre.',
		...actions,
		variant: 'image-focus',
		backgroundImage: '/logo-ddf.png',
		backgroundImageDisplayMode: 'cover'
	}
};
