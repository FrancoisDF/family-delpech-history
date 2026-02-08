import type { Meta, StoryObj } from '@storybook/svelte';
import RichTextBlock from './RichTextBlock.svelte';

const meta = {
	title: 'Builder Components/RichTextBlock',
	component: RichTextBlock,
	tags: ['autodocs']
} satisfies Meta<RichTextBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
