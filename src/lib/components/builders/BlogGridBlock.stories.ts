import type { Meta, StoryObj } from '@storybook/sveltekit';
import BlogGridBlock from './BlogGridBlock.svelte';

const meta = {
	title: 'Builder Components/BlogGridBlock',
	component: BlogGridBlock,
	tags: ['autodocs'],
	argTypes: {
		title: { control: 'text' },
		description: { control: 'text' },
		columnCount: { control: 'select', options: [2, 3, 4] },
		imageDisplayMode: { control: 'select', options: ['cover', 'contain'] }
	}
} satisfies Meta<typeof BlogGridBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: 'Histoires de famille',
		description: 'Plongez dans les récits fascinants de nos ancêtres.',
		columnCount: 3,
		imageDisplayMode: 'cover'
	}
};

export const FourColumnsContained: Story = {
	args: {
		title: 'Toutes les archives',
		description: '',
		columnCount: 4,
		imageDisplayMode: 'contain'
	}
};
