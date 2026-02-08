import type { Meta, StoryObj } from '@storybook/svelte';
import AccordionBlock from './AccordionBlock.svelte';

const meta = {
	title: 'Builder Components/AccordionBlock',
	component: AccordionBlock,
	tags: ['autodocs']
} satisfies Meta<AccordionBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
