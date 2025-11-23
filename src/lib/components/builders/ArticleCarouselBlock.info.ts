import type { ComponentInfo } from '@builder.io/sdk-svelte';
import ArticleCarouselBlock from './ArticleCarouselBlock.svelte';

export const articleCarouselBlockInfo: ComponentInfo = {
	component: ArticleCarouselBlock,
	name: 'ArticleCarouselBlock',
	tag: 'Carousels & Sliders',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Articles Connexes'
		},
		{
			name: 'articles',
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
					name: 'handle',
					type: 'string'
				}
			]
		},
		{
			name: 'itemsPerSlide',
			type: 'number',
			defaultValue: 3
		}
	]
};
