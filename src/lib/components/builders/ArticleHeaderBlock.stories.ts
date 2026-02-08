import type { Meta, StoryObj } from '@storybook/svelte';
import ArticleHeaderBlock from './ArticleHeaderBlock.svelte';

const meta = {
	title: 'Builder Components/ArticleHeaderBlock',
	component: ArticleHeaderBlock,
	tags: ['autodocs']
} satisfies Meta<ArticleHeaderBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
