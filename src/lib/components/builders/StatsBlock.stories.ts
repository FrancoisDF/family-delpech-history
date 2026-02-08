import type { Meta, StoryObj } from '@storybook/svelte';
import StatsBlock from './StatsBlock.svelte';

const meta = {
	title: 'Builder Components/StatsBlock',
	component: StatsBlock,
	tags: ['autodocs']
} satisfies Meta<StatsBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
