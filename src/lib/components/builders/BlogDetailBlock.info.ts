import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import BlogDetailBlock from './BlogDetailBlock.svelte';

export const blogDetailBlockInfo: RegisteredComponent = {
	component: BlogDetailBlock as any,
	name: 'BlogDetailBlock',
	tag: 'Article Pages',
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
			name: 'featuredImageDisplayMode',
			type: 'string',
			enum: ['cover', 'contain'],
			defaultValue: 'cover',
			helperText: 'Cover: fills the space (may crop), Contain: shows full image'
		},
		{
			name: 'author',
			type: 'string',
			defaultValue: ''
		}
	]
};
