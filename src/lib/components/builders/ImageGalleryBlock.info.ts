import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import ImageGalleryBlock from './ImageGalleryBlock.svelte';

export const imageGalleryBlockInfo: RegisteredComponent = {
	component: ImageGalleryBlock,
	name: 'ImageGalleryBlock',
	tag: 'Galleries & Collections',
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
				},
				{
					name: 'description',
					type: 'richText',
					defaultValue: '',
					helperText: 'Description shown on card flip - supports rich text'
				},
				{
					name: 'imageDisplayMode',
					type: 'string',
					enum: ['cover', 'contain'],
					defaultValue: 'cover',
					helperText: 'Cover: fills the space (may crop), Contain: shows full image'
				}
			]
		},
		{
			name: 'columns',
			type: 'number',
			enum: [2, 3, 4],
			defaultValue: 3
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
