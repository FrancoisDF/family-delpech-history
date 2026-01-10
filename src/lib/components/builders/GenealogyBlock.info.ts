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
		},
		{
			name: 'people',
			type: 'list',
			defaultValue: [],
			required: false,
			helperText: 'Add people to display in the genealogy tree. If empty, uses the root person from GEDCOM data.',
			subFields: [
				{
					name: 'id',
					type: 'string',
					defaultValue: '',
					helperText: 'Unique identifier for this person'
				},
				{
					name: 'name',
					type: 'string',
					defaultValue: '',
					helperText: 'Full name of the person'
				},
				{
					name: 'image',
					type: 'file',
					allowedFileTypes: ['jpeg', 'jpg', 'png', 'webp'],
					defaultValue: '',
					helperText: 'Portrait image of the person'
				},
				{
					name: 'birthDate',
					type: 'string',
					defaultValue: '',
					helperText: 'Birth date (YYYY-MM-DD format)'
				},
				{
					name: 'deathDate',
					type: 'string',
					defaultValue: '',
					helperText: 'Death date (YYYY-MM-DD format, leave empty if still living)'
				},
				{
					name: 'description',
					type: 'longText',
					defaultValue: '',
					helperText: 'Brief biography or description of the person'
				}
			]
		},
		{
			name: 'relationships',
			type: 'list',
			defaultValue: [],
			required: false,
			helperText: 'Define relationships between people in the tree',
			subFields: [
				{
					name: 'personId',
					type: 'string',
					defaultValue: '',
					helperText: 'ID of the person'
				},
				{
					name: 'relationType',
					type: 'string',
					enum: ['spouse', 'child', 'parent', 'friend'],
					defaultValue: 'spouse',
					helperText: 'Type of relationship: spouse (for couples), child (children), parent (parents), friend'
				},
				{
					name: 'relatedPersonId',
					type: 'string',
					defaultValue: '',
					helperText: 'ID of the related person'
				}
			]
		}
	]
};
