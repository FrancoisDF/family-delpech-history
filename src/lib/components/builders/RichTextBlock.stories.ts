import type { Meta, StoryObj } from '@storybook/sveltekit';
import RichTextBlock from './RichTextBlock.svelte';

const meta = {
	title: 'Builder Components/RichTextBlock',
	component: RichTextBlock,
	tags: ['autodocs'],
	argTypes: {
		content: { control: 'text' },
		backgroundColor: { control: 'text' },
		textSize: { control: 'select', options: ['text-base', 'text-lg', 'text-xl', 'text-2xl'] },
		maxWidth: { control: 'select', options: ['max-w-2xl', 'max-w-4xl', 'max-w-6xl'] },
		connectTop: { control: 'boolean' },
		connectBottom: { control: 'boolean' }
	}
} satisfies Meta<typeof RichTextBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MarkdownContent: Story = {
	args: {
		content:
			'# Une histoire documentée\n\n**Trois générations** ont laissé des traces dans cette maison.\n\n* Une lettre de 1904\n* Un carnet de voyage\n\n[Consulter les archives](#archives)',
		backgroundColor: 'bg-primary-50',
		textSize: 'text-lg',
		maxWidth: 'max-w-4xl',
		connectTop: false,
		connectBottom: false
	}
};

export const Empty: Story = {
	args: {
		content: '',
		backgroundColor: 'bg-white',
		textSize: 'text-base',
		maxWidth: 'max-w-4xl',
		connectTop: false,
		connectBottom: false
	}
};
