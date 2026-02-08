import type { Meta, StoryObj } from '@storybook/svelte';
import ImageGalleryBlock from './ImageGalleryBlock.svelte';

const meta = {
	title: 'Builder Components/ImageGalleryBlock',
	component: ImageGalleryBlock,
	tags: ['autodocs']
} satisfies Meta<ImageGalleryBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
