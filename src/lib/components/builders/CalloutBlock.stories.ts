import type { Meta, StoryObj } from '@storybook/svelte';
import CalloutBlock from './CalloutBlock.svelte';

const meta = {
	title: 'Builder Components/CalloutBlock',
	component: CalloutBlock,
	tags: ['autodocs']
} satisfies Meta<CalloutBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
