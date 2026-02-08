import type { Meta, StoryObj } from '@storybook/svelte';
import StorySectionCard from './StorySectionCard.svelte';

const meta = {
	title: 'Builder Components/StorySectionCard',
	component: StorySectionCard,
	tags: ['autodocs']
} satisfies Meta<StorySectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
