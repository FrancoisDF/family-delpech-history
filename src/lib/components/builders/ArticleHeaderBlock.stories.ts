import type { Meta, StoryObj } from '@storybook/sveltekit';
import { fn } from 'storybook/test';
import ArticleHeaderBlock from './ArticleHeaderBlock.svelte';

const meta = {
	title: 'Builder Components/ArticleHeaderBlock',
	component: ArticleHeaderBlock,
	tags: ['autodocs'],
	argTypes: {
		title: { control: 'text' },
		excerpt: { control: 'text' },
		date: { control: 'text' },
		readTime: { control: 'text' },
		author: { control: 'text' },
		category: { control: 'text' },
		featuredImage: { control: 'text' },
		featuredImageDisplayMode: { control: 'select', options: ['cover', 'contain'] },
		pdfFile: { control: 'text' },
		onOpenPDFModal: { action: 'open PDF modal' }
	}
} satisfies Meta<typeof ArticleHeaderBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: 'Le carnet de voyage de Marie',
		excerpt: 'Un récit retrouvé dans les archives familiales raconte le départ vers le sud.',
		date: '12 juin 1904',
		readTime: '6 min de lecture',
		author: 'Claire Delpech',
		category: 'Correspondances',
		featuredImage: '/logo-ddf.png',
		featuredImageDisplayMode: 'cover',
		pdfFile: '',
		onOpenPDFModal: fn()
	}
};

export const WithPdfActions: Story = {
	args: {
		...Default.args,
		title: 'Inventaire des archives',
		featuredImageDisplayMode: 'contain',
		pdfFile: '/favicon.png',
		onOpenPDFModal: fn()
	}
};

export const TextOnly: Story = {
	args: {
		title: 'Une histoire sans image',
		excerpt: 'Les détails importants peuvent aussi commencer par quelques lignes.',
		date: '1821',
		readTime: '3 min de lecture',
		author: '',
		category: '',
		featuredImage: '',
		pdfFile: '',
		onOpenPDFModal: fn()
	}
};
