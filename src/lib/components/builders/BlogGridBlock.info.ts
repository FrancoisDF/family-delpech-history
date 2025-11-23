import type { ComponentInfo } from '@builder.io/sdk-svelte';
import BlogGridBlock from './BlogGridBlock.svelte';

export const blogGridBlockInfo: ComponentInfo = {
	component: BlogGridBlock,
	name: 'BlogGridBlock',
	tag: 'Page Sections',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Histoires de Famille'
		},
		{
			name: 'description',
			type: 'string',
			defaultValue: 'Plongez dans les récits fascinants de nos ancêtres.'
		},
		{
			name: 'columnCount',
			type: 'number',
			defaultValue: 3,
			enum: [2, 3, 4]
		},
		{
			name: 'posts',
			type: 'list',
			subFields: [
				{
					name: 'id',
					type: 'string'
				},
				{
					name: 'title',
					type: 'string'
				},
				{
					name: 'excerpt',
					type: 'string'
				},
				{
					name: 'date',
					type: 'string'
				},
				{
					name: 'readTime',
					type: 'string'
				},
				{
					name: 'category',
					type: 'string'
				},
				{
					name: 'featuredImage',
					type: 'file'
				},
				{
					name: 'slug',
					type: 'string'
				},
				{
					name: 'handle',
					type: 'string'
				}
			]
		}
	]
};
