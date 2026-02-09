import type { Meta, StoryObj } from '@storybook/svelte';
import CTABlock from './CTABlock.svelte';

const meta = {
	title: 'Builder Components/CTABlock',
	component: CTABlock,
	tags: ['autodocs'],
	argTypes: {
		title: {
			control: 'text',
			description: 'Call to action title'
		},
		description: {
			control: 'text',
			description: 'Call to action description'
		},
		buttonText: {
			control: 'text',
			description: 'Button text'
		},
		buttonLink: {
			control: 'text',
			description: 'Button link URL'
		}
	}
} satisfies Meta<CTABlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: 'Vous Avez des Questions ?',
		description: 'Explorez nos archives complètes grâce à notre assistant IA.',
		buttonText: "Accéder à l'Assistant IA",
		buttonLink: '/chat'
	}
};

export const ExploreStories: Story = {
	args: {
		title: 'Découvrez les Histoires Familiales',
		description:
			'Plongez dans les récits captivants de votre histoire familiale et explorez les générations passées.',
		buttonText: 'Voir les Histoires',
		buttonLink: '/histoires'
	}
};

export const GenealogyFocus: Story = {
	args: {
		title: 'Explorez Votre Généalogie',
		description:
			'Visualisez votre arbre généalogique et découvrez les connexions entre vos ancêtres.',
		buttonText: "Voir l'Arbre Généalogique",
		buttonLink: '/genealogy'
	}
};
