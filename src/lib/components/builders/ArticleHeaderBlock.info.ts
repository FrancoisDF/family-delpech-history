import type { ComponentInfo } from '@builder.io/sdk-svelte';
import ArticleHeaderBlock from './ArticleHeaderBlock.svelte';

export const articleHeaderBlockInfo: ComponentInfo = {
	component: ArticleHeaderBlock,
	name: 'ArticleHeaderBlock',
	tag: 'Headers & Titles',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Article Title'
		},
		{
			name: 'excerpt',
			type: 'string',
			defaultValue: ''
		},
		{
			name: 'date',
			type: 'string',
			defaultValue: ''
		},
		{
			name: 'readTime',
			type: 'string',
			defaultValue: ''
		},
		{
			name: 'category',
			type: 'string',
			defaultValue: ''
		},
		{
			name: 'featuredImage',
			type: 'file',
			allowedFileTypes: ['jpeg', 'jpg', 'png', 'svg', 'webp'],
			defaultValue: ''
		},
		{
			name: 'author',
			type: 'string',
			defaultValue: ''
		}
	]
};
