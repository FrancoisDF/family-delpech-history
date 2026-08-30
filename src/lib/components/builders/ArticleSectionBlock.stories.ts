import type { Meta, StoryObj } from '@storybook/sveltekit';
import ArticleSectionBlock from './ArticleSectionBlock.svelte';

const meta = {
	title: 'Builder Components/ArticleSectionBlock',
	component: ArticleSectionBlock,
	tags: ['autodocs'],
	argTypes: {
		title: { control: 'text' },
		anchorId: { control: 'text' },
		content: { control: 'text' },
		image: { control: 'text' },
		imageAlt: { control: 'text' },
		imagePosition: { control: 'select', options: ['none', 'top', 'bottom', 'left', 'right'] },
		imageDisplayMode: { control: 'select', options: ['cover', 'contain'] },
		backgroundColor: { control: 'select', options: ['bg-white', 'bg-primary-50', 'bg-cream'] },
		connectTop: { control: 'boolean' },
		connectBottom: { control: 'boolean' }
	}
} satisfies Meta<typeof ArticleSectionBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const content =
	'<p>Les archives révèlent les liens entre les maisons, les métiers et les voyages.</p>';

export const Default: Story = {
	args: {
		title: 'Les archives de la famille',
		anchorId: 'archives-famille',
		content,
		image: '/logo-ddf.png',
		imageAlt: 'Archives familiales',
		imagePosition: 'top',
		imageDisplayMode: 'contain',
		backgroundColor: 'bg-white',
		connectTop: false,
		connectBottom: false
	}
};

export const ImageOnTheSide: Story = {
	args: {
		...Default.args,
		imagePosition: 'right',
		imageDisplayMode: 'cover',
		backgroundColor: 'bg-primary-50'
	}
};

export const Connected: Story = {
	args: { ...Default.args, image: '', imagePosition: 'none', connectTop: true, connectBottom: true }
};
