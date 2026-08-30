import type { Meta, StoryObj } from '@storybook/sveltekit';
import ArticleCarouselBlock from './ArticleCarouselBlock.svelte';

const meta = {
	title: 'Builder Components/ArticleCarouselBlock',
	component: ArticleCarouselBlock,
	tags: ['autodocs'],
	argTypes: {
		title: { control: 'text' },
		tags: { control: 'object' },
		itemsPerSlide: { control: { type: 'number', min: 1, max: 4, step: 1 } },
		imageDisplayMode: { control: 'select', options: ['cover', 'contain'] }
	}
} satisfies Meta<typeof ArticleCarouselBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const tags = [{ tag: { id: 'family-history' } }];

export const Default: Story = {
	args: { title: 'Articles connexes', tags, itemsPerSlide: 3, imageDisplayMode: 'cover' }
};

export const ContainedImages: Story = {
	args: { title: 'Explorer les archives', tags, itemsPerSlide: 2, imageDisplayMode: 'contain' }
};

export const Empty: Story = {
	args: { title: 'Articles connexes', tags: [], itemsPerSlide: 3, imageDisplayMode: 'cover' }
};
