import type { Meta, StoryObj } from '@storybook/sveltekit';
import ArticleContentBlock from './ArticleContentBlock.svelte';

const meta = {
	title: 'Builder Components/ArticleContentBlock',
	component: ArticleContentBlock,
	tags: ['autodocs'],
	argTypes: {
		content: { control: 'text' },
		backgroundColor: { control: 'text' }
	}
} satisfies Meta<typeof ArticleContentBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		content:
			'<h2>Une histoire à transmettre</h2><p>Chaque document apporte un nouvel indice sur les générations qui nous précèdent.</p>',
		backgroundColor: 'bg-primary-50'
	}
};

export const Empty: Story = { args: { content: '', backgroundColor: 'bg-white' } };
