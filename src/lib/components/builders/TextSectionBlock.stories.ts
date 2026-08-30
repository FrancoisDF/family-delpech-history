import type { Meta, StoryObj } from '@storybook/sveltekit';
import TextSectionBlock from './TextSectionBlock.svelte';

const meta = {
	title: 'Builder Components/TextSectionBlock',
	component: TextSectionBlock,
	tags: ['autodocs'],
	argTypes: {
		content: { control: 'text' },
		textSize: { control: 'select', options: ['text-base', 'text-lg', 'text-xl', 'text-2xl'] },
		textAlign: {
			control: 'select',
			options: ['text-left', 'text-center', 'text-right', 'text-justify']
		},
		connectTop: { control: 'boolean' },
		connectBottom: { control: 'boolean' }
	}
} satisfies Meta<typeof TextSectionBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const content =
	'<p>La généalogie est une enquête patiente où chaque indice relie une génération à la suivante.</p>';

export const Default: Story = {
	args: {
		content,
		textSize: 'text-lg',
		textAlign: 'text-left',
		connectTop: false,
		connectBottom: false
	}
};
export const LargeCentered: Story = {
	args: {
		content,
		textSize: 'text-2xl',
		textAlign: 'text-center',
		connectTop: false,
		connectBottom: false
	}
};
export const Connected: Story = {
	args: {
		content,
		textSize: 'text-base',
		textAlign: 'text-justify',
		connectTop: true,
		connectBottom: true
	}
};
