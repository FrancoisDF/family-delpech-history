import type { ComponentInfo } from '@builder.io/sdk-svelte';
import BlogDetailBlock from './BlogDetailBlock.svelte';

export const blogDetailBlockInfo: ComponentInfo = {
	component: BlogDetailBlock,
	name: 'BlogDetailBlock',
	tag: 'Page Sections',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: ''
		},
		{
			name: 'excerpt',
			type: 'string',
			defaultValue: ''
		},
		{
			name: 'content',
			type: 'richText',
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
