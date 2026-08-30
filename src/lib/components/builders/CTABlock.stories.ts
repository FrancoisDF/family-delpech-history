import type { Meta, StoryObj } from '@storybook/sveltekit';
import CTABlock from './CTABlock.svelte';

const meta = {
	title: 'Builder Components/CTABlock',
	component: CTABlock,
	tags: ['autodocs'],
	argTypes: {
		title: { control: 'text' },
		description: { control: 'text' },
		buttonText: { control: 'text' },
		buttonLink: { control: 'text' }
	}
} satisfies Meta<typeof CTABlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: 'Vous avez des questions ?',
		description: 'Explorez nos archives complètes grâce à notre assistant IA.',
		buttonText: "Accéder à l'assistant IA",
		buttonLink: '/chat'
	}
};

export const ExploreStories: Story = {
	args: {
		title: 'Découvrez les histoires familiales',
		description: 'Plongez dans les récits captivants de votre histoire familiale.',
		buttonText: 'Voir les histoires',
		buttonLink: '/histoires'
	}
};
