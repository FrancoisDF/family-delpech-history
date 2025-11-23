import type { ComponentInfo } from '@builder.io/sdk-svelte';
import CalloutBlock from './CalloutBlock.svelte';

export const calloutBlockInfo: ComponentInfo = {
	component: CalloutBlock,
	name: 'CalloutBlock',
	tag: 'Callouts & Alerts',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'À Noter'
		},
		{
			name: 'content',
			type: 'richText',
			defaultValue: 'Information importante à mettre en évidence...'
		},
		{
			name: 'type',
			type: 'string',
			enum: ['info', 'warning', 'success', 'tip'],
			defaultValue: 'info'
		},
		{
			name: 'icon',
			type: 'string',
			enum: ['info', 'warning', 'success', 'lightbulb'],
			defaultValue: 'info'
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
