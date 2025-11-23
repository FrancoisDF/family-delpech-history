import type { ComponentInfo } from '@builder.io/sdk-svelte';
import AccordionBlock from './AccordionBlock.svelte';

export const accordionBlockInfo: ComponentInfo = {
	component: AccordionBlock,
	name: 'AccordionBlock',
	tag: 'Interactive Elements',
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
					type: 'richText',
					defaultValue: 'Réponse détaillée...'
				}
			]
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
