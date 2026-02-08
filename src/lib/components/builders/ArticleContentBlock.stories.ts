import type { Meta, StoryObj } from '@storybook/svelte';
import ArticleContentBlock from './ArticleContentBlock.svelte';

const meta = {
	title: 'Builder Components/ArticleContentBlock',
	component: ArticleContentBlock,
	tags: ['autodocs']
} satisfies Meta<ArticleContentBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
