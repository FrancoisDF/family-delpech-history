import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import ImageBlock from './ImageBlock.svelte';

export const imageBlockInfo: RegisteredComponent = {
	component: ImageBlock,
	name: 'ImageBlock',
	tag: 'Images & Media',
	inputs: [
		{
			name: 'imageUrl',
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
			name: 'caption',
			type: 'string',
			defaultValue: ''
		},
		{
			name: 'imageSize',
			type: 'string',
			enum: ['small', 'medium', 'large', 'full'],
			defaultValue: 'full'
		},
		{
			name: 'alignment',
			type: 'string',
			enum: ['left', 'center', 'right'],
			defaultValue: 'center'
		},
		{
			name: 'roundedCorners',
			type: 'boolean',
			defaultValue: true
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
