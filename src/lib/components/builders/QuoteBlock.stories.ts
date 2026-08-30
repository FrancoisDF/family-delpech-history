import type { Meta, StoryObj } from '@storybook/sveltekit';
import QuoteBlock from './QuoteBlock.svelte';

const meta = {
	title: 'Builder Components/QuoteBlock',
	component: QuoteBlock,
	tags: ['autodocs'],
	argTypes: {
		quote: { control: 'text' },
		author: { control: 'text' },
		authorTitle: { control: 'text' },
		style: { control: 'select', options: ['centered', 'sidebar'] },
		connectTop: { control: 'boolean' },
		connectBottom: { control: 'boolean' }
	}
} satisfies Meta<typeof QuoteBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const quote =
	'« La mémoire familiale se construit avec les petits détails que chacun choisit de transmettre. »';

export const Centered: Story = {
	args: {
		quote,
		author: 'Jeanne Delpech',
		authorTitle: 'Carnet familial, 1925',
		style: 'centered',
		connectTop: false,
		connectBottom: false
	}
};
export const Sidebar: Story = {
	args: {
		quote,
		author: 'Pierre Delpech',
		authorTitle: 'Lettre à sa sœur',
		style: 'sidebar',
		connectTop: true,
		connectBottom: false
	}
};
