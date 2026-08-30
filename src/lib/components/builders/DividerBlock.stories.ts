import type { Meta, StoryObj } from '@storybook/sveltekit';
import DividerBlock from './DividerBlock.svelte';

const meta = {
	title: 'Builder Components/DividerBlock',
	component: DividerBlock,
	tags: ['autodocs'],
	argTypes: {
		style: { control: 'select', options: ['solid', 'dashed', 'decorative'] },
		thickness: { control: 'select', options: ['thin', 'medium', 'thick'] },
		spacing: { control: 'select', options: ['small', 'medium', 'large'] }
	}
} satisfies Meta<typeof DividerBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = { args: { style: 'solid', thickness: 'medium', spacing: 'medium' } };
export const Dashed: Story = { args: { style: 'dashed', thickness: 'thin', spacing: 'large' } };
export const Decorative: Story = {
	args: { style: 'decorative', thickness: 'medium', spacing: 'small' }
};
