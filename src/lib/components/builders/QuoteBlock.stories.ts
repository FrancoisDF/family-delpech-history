import type { Meta, StoryObj } from '@storybook/svelte';
import QuoteBlock from './QuoteBlock.svelte';

const meta = {
	title: 'Builder Components/QuoteBlock',
	component: QuoteBlock,
	tags: ['autodocs']
} satisfies Meta<QuoteBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
