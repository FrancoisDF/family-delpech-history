import type { ComponentInfo } from '@builder.io/sdk-svelte';
import ImageTextBlock from './ImageTextBlock.svelte';

export const imageTextBlockInfo: ComponentInfo = {
	component: ImageTextBlock,
	name: 'ImageTextBlock',
	tag: 'Content Sections',
	inputs: [
		{
			name: 'image',
			type: 'file',
			allowedFileTypes: ['jpeg', 'jpg', 'png', 'svg', 'webp'],
			defaultValue: ''
		},
		{
			name: 'imageAlt',
			type: 'string',
			defaultValue: 'Image description'
		},
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Section Title'
		},
		{
			name: 'content',
			type: 'richText',
			defaultValue: 'Your content here...'
		},
		{
			name: 'imagePosition',
			type: 'string',
			enum: ['left', 'right'],
			defaultValue: 'left'
		},
		{
			name: 'imageWidth',
			type: 'string',
			enum: ['w-1/3', 'w-1/2', 'w-2/3'],
			defaultValue: 'w-1/2'
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
