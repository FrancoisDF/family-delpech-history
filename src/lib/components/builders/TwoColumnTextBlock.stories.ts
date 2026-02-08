import type { Meta, StoryObj } from '@storybook/svelte';
import TwoColumnTextBlock from './TwoColumnTextBlock.svelte';

const meta = {
	title: 'Builder Components/TwoColumnTextBlock',
	component: TwoColumnTextBlock,
	tags: ['autodocs']
} satisfies Meta<TwoColumnTextBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
