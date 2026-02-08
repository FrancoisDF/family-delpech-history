import type { Meta, StoryObj } from '@storybook/svelte';
import ArticleCarouselBlock from './ArticleCarouselBlock.svelte';

const meta = {
	title: 'Builder Components/ArticleCarouselBlock',
	component: ArticleCarouselBlock,
	tags: ['autodocs']
} satisfies Meta<ArticleCarouselBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
