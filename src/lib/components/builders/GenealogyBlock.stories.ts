import type { Meta, StoryObj } from '@storybook/sveltekit';
import { fn } from 'storybook/test';
import GenealogyBlock from './GenealogyBlock.svelte';

const meta = {
	title: 'Builder Components/GenealogyBlock',
	component: GenealogyBlock,
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen' },
	argTypes: {
		title: { control: 'text' },
		description: { control: 'text' },
		showTitle: { control: 'boolean' },
		backgroundColor: { control: 'color' },
		people: { control: 'object' },
		relationships: { control: 'object' },
		onSetRootPerson: { action: 'set root person' }
	}
} satisfies Meta<typeof GenealogyBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const people = [
	{
		id: 'pierre',
		name: 'Pierre Delpech',
		birthDate: '1840-04-12',
		deathDate: '1910-08-03',
		image: '/logo-ddf.png',
		description: 'Ancêtre et artisan de la famille.'
	},
	{
		id: 'marie',
		name: 'Marie Blanc',
		birthDate: '1845-09-20',
		deathDate: '1921-02-11',
		image: '/logo-ddf.png',
		description: 'Épouse de Pierre et gardienne des lettres familiales.'
	},
	{
		id: 'joseph',
		name: 'Joseph Delpech',
		birthDate: '1870-01-06',
		deathDate: '1942-05-16',
		image: '/logo-ddf.png',
		description: 'Leur fils, parti travailler à Toulouse.'
	}
];

const relationships = [
	{ personId: 'pierre', relationType: 'spouse' as const, relatedPersonId: 'marie' },
	{
		personId: 'pierre',
		relationType: 'child' as const,
		relatedPersonId: 'joseph',
		spouseId: 'marie'
	}
];

export const ConfiguredTree: Story = {
	args: {
		title: 'Arbre généalogique',
		description: 'Explorez les liens entre trois générations.',
		showTitle: true,
		backgroundColor: '#fafaf8',
		people,
		relationships,
		onSetRootPerson: fn()
	}
};

export const TitleHidden: Story = {
	args: { ...ConfiguredTree.args, showTitle: false, backgroundColor: '#ffffff' }
};

export const Empty: Story = {
	args: {
		title: 'Arbre généalogique',
		description: '',
		showTitle: true,
		people: [],
		relationships: [],
		onSetRootPerson: fn()
	}
};
