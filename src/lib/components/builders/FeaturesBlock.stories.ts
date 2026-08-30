import type { Meta, StoryObj } from '@storybook/sveltekit';
import FeaturesBlock from './FeaturesBlock.svelte';

const meta = {
	title: 'Builder Components/FeaturesBlock',
	component: FeaturesBlock,
	tags: ['autodocs'],
	argTypes: { title: { control: 'text' }, features: { control: 'object' } }
} satisfies Meta<typeof FeaturesBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const features = [
	{
		number: '01',
		title: 'Explorer',
		description: 'Parcourez les récits et les documents par période.'
	},
	{
		number: '02',
		title: 'Écouter',
		description: 'Suivez les histoires racontées au fil des générations.'
	},
	{
		number: '03',
		title: 'Transmettre',
		description: 'Conservez les souvenirs pour les générations futures.'
	}
];

export const Default: Story = { args: { title: 'Faits intéressants', features } };
export const Extended: Story = {
	args: {
		title: 'Une recherche guidée',
		features: [
			...features,
			{
				number: '04',
				title: 'Partager',
				description: 'Invitez votre famille à enrichir les archives.'
			}
		]
	}
};
export const Empty: Story = { args: { title: 'Faits intéressants', features: [] } };
