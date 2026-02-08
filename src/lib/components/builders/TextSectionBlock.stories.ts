import type { Meta, StoryObj } from '@storybook/svelte';
import TextSectionBlock from './TextSectionBlock.svelte';

const meta = {
	title: 'Builder Components/TextSectionBlock',
	component: TextSectionBlock,
	tags: ['autodocs'],
	argTypes: {
		content: {
			control: 'text',
			description: 'Rich text content'
		},
		textSize: {
			control: 'select',
			options: ['text-base', 'text-lg', 'text-xl', 'text-2xl'],
			description: 'Text size'
		},
		textAlign: {
			control: 'select',
			options: ['text-left', 'text-center', 'text-right'],
			description: 'Text alignment'
		},
		connectTop: {
			control: 'boolean',
			description: 'Remove top spacing'
		},
		connectBottom: {
			control: 'boolean',
			description: 'Remove bottom spacing'
		}
	}
} satisfies Meta<TextSectionBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		content: 'Votre texte ici...',
		textSize: 'text-lg',
		textAlign: 'text-left',
		connectTop: false,
		connectBottom: false
	}
};

export const LargeCentered: Story = {
	args: {
		content:
			'L\'histoire de nos familles est tissée dans le temps, chaque génération ajoutant son fil à la tapisserie de notre héritage.',
		textSize: 'text-2xl',
		textAlign: 'text-center',
		connectTop: false,
		connectBottom: false
	}
};

export const BodyText: Story = {
	args: {
		content:
			'La généalogie est l\'étude des relations familiales sur plusieurs générations. Elle nous aide à comprendre d\'où nous venons et comment notre famille s\'est développée au fil du temps.',
		textSize: 'text-base',
		textAlign: 'text-justify',
		connectTop: false,
		connectBottom: false
	}
};
