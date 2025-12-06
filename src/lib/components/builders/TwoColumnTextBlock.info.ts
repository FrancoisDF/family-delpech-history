import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import TwoColumnTextBlock from './TwoColumnTextBlock.svelte';

export const twoColumnTextBlockInfo: RegisteredComponent = {
	component: TwoColumnTextBlock,
	name: 'TwoColumnTextBlock',
	tag: 'Layout & Columns',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: ''
		},
		{
			name: 'leftContent',
			type: 'richText',
			defaultValue: 'Contenu de la colonne gauche...'
		},
		{
			name: 'rightContent',
			type: 'richText',
			defaultValue: 'Contenu de la colonne droite...'
		},
		{
			name: 'connectTop',
			type: 'boolean',
			defaultValue: false,
			helperText: 'Remove top spacing to connect with section above'
		},
		{
			name: 'connectBottom',
			type: 'boolean',
			defaultValue: false,
			helperText: 'Remove bottom spacing to connect with section below'
		}
	]
};
