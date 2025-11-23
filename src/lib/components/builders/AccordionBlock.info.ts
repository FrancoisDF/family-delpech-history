import type { ComponentInfo } from '@builder.io/sdk-svelte';
import AccordionBlock from './AccordionBlock.svelte';

export const accordionBlockInfo: ComponentInfo = {
	component: AccordionBlock,
	name: 'AccordionBlock',
	tag: 'Article Content',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Questions Fréquentes'
		},
		{
			name: 'items',
			type: 'list',
			defaultValue: [],
			subFields: [
				{
					name: 'question',
					type: 'string',
					defaultValue: 'Question?'
				},
				{
					name: 'answer',
					type: 'longText',
					defaultValue: 'Réponse détaillée...'
				}
			]
		}
	]
};
