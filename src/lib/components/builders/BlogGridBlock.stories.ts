import type { Meta, StoryObj } from '@storybook/svelte';
import BlogGridBlock from './BlogGridBlock.svelte';

const meta = {
	title: 'Builder Components/BlogGridBlock',
	component: BlogGridBlock,
	tags: ['autodocs']
} satisfies Meta<BlogGridBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
