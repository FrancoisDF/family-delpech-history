import type { ComponentInfo } from '@builder.io/sdk-svelte';
import RichTextBlock from './RichTextBlock.svelte';

export const richTextBlockInfo: ComponentInfo = {
	component: RichTextBlock,
	name: 'RichTextBlock',
	tag: 'Article Content',
	inputs: [
		{
			name: 'content',
			type: 'longText',
			defaultValue: '# Titre Principal\n\nVotre contenu ici avec **gras**, *italique*, et [liens](https://example.com).\n\n## Sous-titre\n\nPlus de contenu...\n\n* Liste item 1\n* Liste item 2'
		},
		{
			name: 'backgroundColor',
			type: 'string',
			enum: ['bg-gradient-warm', 'bg-white', 'bg-primary-50'],
			defaultValue: 'bg-gradient-warm'
		},
		{
			name: 'textSize',
			type: 'string',
			enum: ['text-sm', 'text-base', 'text-lg', 'text-xl'],
			defaultValue: 'text-base'
		},
		{
			name: 'maxWidth',
			type: 'string',
			enum: ['max-w-2xl', 'max-w-4xl', 'max-w-6xl'],
			defaultValue: 'max-w-4xl'
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
