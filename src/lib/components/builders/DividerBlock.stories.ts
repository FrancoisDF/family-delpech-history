import type { Meta, StoryObj } from '@storybook/svelte';
import DividerBlock from './DividerBlock.svelte';

const meta = {
	title: 'Builder Components/DividerBlock',
	component: DividerBlock,
	tags: ['autodocs']
} satisfies Meta<DividerBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
