import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import QuoteBlock from './QuoteBlock.svelte';

export const quoteBlockInfo: RegisteredComponent = {
	component: QuoteBlock,
	name: 'QuoteBlock',
	tag: 'Quotes & Highlights',
	inputs: [
		{
			name: 'quote',
			type: 'richText',
			defaultValue: 'Your inspiring quote here...'
		},
		{
			name: 'author',
			type: 'string',
			defaultValue: 'Author Name'
		},
		{
			name: 'authorTitle',
			type: 'string',
			defaultValue: ''
		},
		{
			name: 'style',
			type: 'string',
			enum: ['centered', 'sidebar'],
			defaultValue: 'centered'
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
