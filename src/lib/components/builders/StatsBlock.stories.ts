import type { Meta, StoryObj } from '@storybook/sveltekit';
import StatsBlock from './StatsBlock.svelte';

const meta = {
	title: 'Builder Components/StatsBlock',
	component: StatsBlock,
	tags: ['autodocs'],
	argTypes: {
		title: { control: 'text' },
		stats: { control: 'object' },
		columns: { control: 'select', options: [2, 3, 4] }
	}
} satisfies Meta<typeof StatsBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const stats = [
	{ value: '12', label: 'générations', description: 'Documentées dans notre arbre familial' },
	{ value: '248', label: 'documents', description: 'Lettres, photos et actes conservés' },
	{ value: '6', label: 'villages', description: 'Reliés par les récits de la famille' }
];

export const Default: Story = { args: { title: 'Le saviez-vous ?', stats, columns: 3 } };
export const TwoColumns: Story = {
	args: { title: 'Quelques chiffres', stats: stats.slice(0, 2), columns: 2 }
};
export const Empty: Story = { args: { title: 'Le saviez-vous ?', stats: [], columns: 3 } };
