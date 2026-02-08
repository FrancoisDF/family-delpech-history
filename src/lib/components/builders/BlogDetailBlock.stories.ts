import type { Meta, StoryObj } from '@storybook/svelte';
import BlogDetailBlock from './BlogDetailBlock.svelte';

const meta = {
	title: 'Builder Components/BlogDetailBlock',
	component: BlogDetailBlock,
	tags: ['autodocs']
} satisfies Meta<BlogDetailBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
