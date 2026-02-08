import type { Meta, StoryObj } from '@storybook/svelte';
import PDFCarouselBlock from './PDFCarouselBlock.svelte';

const meta = {
	title: 'Builder Components/PDFCarouselBlock',
	component: PDFCarouselBlock,
	tags: ['autodocs']
} satisfies Meta<PDFCarouselBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
