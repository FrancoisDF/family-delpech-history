import type { ComponentInfo } from '@builder.io/sdk-svelte';
import TwoColumnTextBlock from './TwoColumnTextBlock.svelte';

export const twoColumnTextBlockInfo: ComponentInfo = {
	component: TwoColumnTextBlock,
	name: 'TwoColumnTextBlock',
	tag: 'Page Sections',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: ''
		},
		{
			name: 'leftContent',
			type: 'longText',
			defaultValue: 'Contenu de la colonne gauche...'
		},
		{
			name: 'rightContent',
			type: 'longText',
			defaultValue: 'Contenu de la colonne droite...'
		}
	]
};
