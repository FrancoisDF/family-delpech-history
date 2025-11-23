import type { ComponentInfo } from '@builder.io/sdk-svelte';
import ImageGalleryBlock from './ImageGalleryBlock.svelte';

export const imageGalleryBlockInfo: ComponentInfo = {
	component: ImageGalleryBlock,
	name: 'ImageGalleryBlock',
	tag: 'Page Sections',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Galerie de Photos'
		},
		{
			name: 'images',
			type: 'list',
			defaultValue: [],
			subFields: [
				{
					name: 'url',
					type: 'file',
					allowedFileTypes: ['jpeg', 'jpg', 'png', 'svg', 'webp']
				},
				{
					name: 'alt',
					type: 'string',
					defaultValue: 'Image description'
				},
				{
					name: 'caption',
					type: 'string',
					defaultValue: ''
				}
			]
		},
		{
			name: 'columns',
			type: 'number',
			enum: [2, 3, 4],
			defaultValue: 3
		}
	]
};
