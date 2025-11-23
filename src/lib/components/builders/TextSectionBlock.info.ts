import type { ComponentInfo } from '@builder.io/sdk-svelte';
import TextSectionBlock from './TextSectionBlock.svelte';

export const textSectionBlockInfo: ComponentInfo = {
	component: TextSectionBlock,
	name: 'TextSectionBlock',
	tag: 'Article Content',
	inputs: [
		{
			name: 'content',
			type: 'longText',
			defaultValue: 'Votre texte ici...'
		},
		{
			name: 'textSize',
			type: 'string',
			enum: ['text-base', 'text-lg', 'text-xl', 'text-2xl'],
			defaultValue: 'text-lg'
		},
		{
			name: 'textAlign',
			type: 'string',
			enum: ['text-left', 'text-center', 'text-right'],
			defaultValue: 'text-left'
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
