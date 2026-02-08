import type { Meta, StoryObj } from '@storybook/svelte';
import ArticleSectionBlock from './ArticleSectionBlock.svelte';

const meta = {
	title: 'Builder Components/ArticleSectionBlock',
	component: ArticleSectionBlock,
	tags: ['autodocs']
} satisfies Meta<ArticleSectionBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
