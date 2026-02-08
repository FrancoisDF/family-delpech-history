import type { Meta, StoryObj } from '@storybook/svelte';
import TimelineBlock from './TimelineBlock.svelte';

const meta = {
	title: 'Builder Components/TimelineBlock',
	component: TimelineBlock,
	tags: ['autodocs']
} satisfies Meta<TimelineBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
