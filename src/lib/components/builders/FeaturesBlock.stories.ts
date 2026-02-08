import type { Meta, StoryObj } from '@storybook/svelte';
import FeaturesBlock from './FeaturesBlock.svelte';

const meta = {
	title: 'Builder Components/FeaturesBlock',
	component: FeaturesBlock,
	tags: ['autodocs']
} satisfies Meta<FeaturesBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
