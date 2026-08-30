import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import ArticleCarouselBlock from './ArticleCarouselBlock.svelte';

export const articleCarouselBlockInfo: RegisteredComponent = {
	component: ArticleCarouselBlock as any,
	name: 'ArticleCarouselBlock',
	friendlyName: 'Carrousel d’articles',
	tag: 'Carrousels et curseurs',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Articles Connexes'
		},
		{
			name: 'tags',
			type: 'list',
			defaultValue: [],
			subFields: [
				{
					name: 'tag',
					type: 'object'
				}
			]
		},
		{
			name: 'itemsPerSlide',
			type: 'number',
			defaultValue: 3
		},
		{
			name: 'imageDisplayMode',
			type: 'string',
			enum: ['cover', 'contain'],
			defaultValue: 'cover',
			helperText: 'Cover: fills the space (may crop), Contain: shows full image'
		}
	]
};
