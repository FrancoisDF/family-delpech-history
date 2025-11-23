import type { ComponentInfo } from '@builder.io/sdk-svelte';
import ArticleContentBlock from './ArticleContentBlock.svelte';

export const articleContentBlockInfo: ComponentInfo = {
	component: ArticleContentBlock,
	name: 'ArticleContentBlock',
	tag: 'Article Content',
	inputs: [
		{
			name: 'content',
			type: 'richText',
			defaultValue: ''
		},
		{
			name: 'backgroundColor',
			type: 'string',
			defaultValue: 'bg-gradient-warm',
			enum: ['bg-gradient-warm', 'bg-white', 'bg-primary-50', 'bg-gradient-dark']
		}
	]
};
