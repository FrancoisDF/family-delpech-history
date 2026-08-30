import type { Meta, StoryObj } from '@storybook/sveltekit';
import PDFCarouselBlock from './PDFCarouselBlock.svelte';

const meta = {
	title: 'Builder Components/PDFCarouselBlock',
	component: PDFCarouselBlock,
	tags: ['autodocs'],
	argTypes: {
		title: { control: 'text' },
		description: { control: 'text' },
		pdfs: { control: 'object' }
	}
} satisfies Meta<typeof PDFCarouselBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const pdfs = [
	{
		id: 'census-1900',
		title: 'Recensement de 1900',
		description: 'Extrait des archives communales.',
		pdfFile: '/favicon.png'
	},
	{
		id: 'letter-1878',
		title: 'Lettre de 1878',
		description: 'Une lettre numérisée de la collection familiale.',
		pdfFile: { url: '/favicon.png' }
	},
	{
		id: 'inventory-1821',
		title: 'Inventaire de 1821',
		description: 'Liste des biens et des métiers de la maison.',
		pdfFile: '/favicon.png'
	}
];

export const Default: Story = {
	args: {
		title: 'Documents historiques',
		description: 'Consultez les documents associés à cette histoire.',
		pdfs
	}
};
export const Empty: Story = { args: { title: 'Documents', description: '', pdfs: [] } };
