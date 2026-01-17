import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import ArticleContentBlock from './ArticleContentBlock.svelte';

export const articleContentBlockInfo: RegisteredComponent = {
	component: ArticleContentBlock as any,
	name: 'ArticleContentBlock',
	tag: 'Text & Paragraphs',
	inputs: [
		{
			name: 'content',
			type: 'richText',
			defaultValue: ''
		},
		{
			name: 'backgroundColor',
			type: 'string',
			defaultValue: '',
			enum: ['', 'bg-white', 'bg-primary-50', 'bg-gradient-dark']
		}
	]
};
