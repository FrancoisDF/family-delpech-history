import GenealogyBlock from './GenealogyBlock.svelte';
import type { RegisteredComponent } from '@builder.io/sdk-svelte';

export const genealogyBlockInfo: RegisteredComponent = {
	component: GenealogyBlock,
	name: 'GenealogyBlock',
	tag: 'Genealogy Tree',
	description: 'Interactive genealogical tree component',
	displayName: 'Genealogy Tree',
	image: 'https://cdn.builder.io/api/v1/image/assets/TEMP/5c7e8f9f0c4f8e7d6c5b4a3b2c1d0e9f?width=500',
	defaultChildren: [],
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Arbre Généalogique',
			required: false,
			helperText: 'Title displayed at the top of the genealogy block'
		},
		{
			name: 'description',
			type: 'string',
			defaultValue: "Explorez l'arbre généalogique de la famille Delpech",
			required: false,
			helperText: 'Subtitle or description under the title'
		},
		{
			name: 'rootPersonId',
			type: 'string',
			defaultValue: 'marie-antoinette-delpech',
			required: false,
			helperText: 'ID of the root person to display (e.g., marie-antoinette-delpech, pierre-delpech)',
			enum: [
				'pierre-delpech',
				'marguerite-blanc',
				'marie-antoinette-delpech',
				'antoine-grognier',
				'joseph-delpech-senior',
				'marie-louise-grognier',
				'jean-baptist-grognier',
				'pierre-grognier-junior',
				'elizabeth-grognier',
				'claude-grognier',
				'rose-grognier',
				'antoine-grognier-junior',
				'felicite-grognier',
				'joseph-delpech-junior',
				'henri-delpech'
			]
		},
		{
			name: 'showTitle',
			type: 'boolean',
			defaultValue: true,
			required: false,
			helperText: 'Show or hide the title and description'
		},
		{
			name: 'backgroundColor',
			type: 'string',
			defaultValue: '',
			required: false,
			helperText: 'Background color (e.g., #fafaf8 or transparent)'
		}
	]
};
