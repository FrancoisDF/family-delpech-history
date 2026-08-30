import type { Meta, StoryObj } from '@storybook/sveltekit';
import BlogDetailBlock from './BlogDetailBlock.svelte';

const meta = {
	title: 'Builder Components/BlogDetailBlock',
	component: BlogDetailBlock,
	tags: ['autodocs'],
	argTypes: {
		title: { control: 'text' },
		excerpt: { control: 'text' },
		content: { control: 'text' },
		date: { control: 'text' },
		readTime: { control: 'text' },
		author: { control: 'text' },
		category: { control: 'text' },
		featuredImage: { control: 'text' },
		featuredImageDisplayMode: { control: 'select', options: ['cover', 'contain'] }
	}
} satisfies Meta<typeof BlogDetailBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: 'Une maison, trois générations',
		excerpt: 'La maison de pierre a conservé les traces de plusieurs générations Delpech.',
		content:
			'<p>Une visite des archives et des souvenirs transmis par la famille.</p><h2>Un lieu de mémoire</h2>',
		date: '3 septembre 1878',
		readTime: '4 min de lecture',
		author: 'Claire Delpech',
		category: 'Patrimoine',
		featuredImage: '/logo-ddf.png',
		featuredImageDisplayMode: 'cover'
	}
};

export const WithoutImage: Story = {
	args: {
		...Default.args,
		title: 'Les métiers de nos ancêtres',
		featuredImage: '',
		featuredImageDisplayMode: 'contain'
	}
};
