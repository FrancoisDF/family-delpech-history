import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import HeroBlock from './HeroBlock.svelte';

export const heroBlockInfo: RegisteredComponent = {
	component: HeroBlock as any,
	name: 'HeroBlock',
	tag: 'Hero & Headers',
	inputs: [
		{
			name: 'variant',
			type: 'string',
			enum: ['grayscale', 'color'],
			defaultValue: 'grayscale',
			helperText: 'Choose a visual variant: grayscale (default), color, or image-focus'
		},
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Histoire de Famille'
		},
		{
			name: 'description',
			type: 'string',
			defaultValue: 'Default description'
		},
		{
			name: 'primaryButtonText',
			type: 'string',
			defaultValue: 'Primary Button'
		},
		{
			name: 'primaryButtonLink',
			type: 'string',
			defaultValue: '/'
		},
		{
			name: 'secondaryButtonText',
			type: 'string',
			defaultValue: 'Secondary Button'
		},
		{
			name: 'secondaryButtonLink',
			type: 'string',
			defaultValue: '/'
		},
		{
			name: 'backgroundImage',
			type: 'file',
			allowedFileTypes: ['jpeg', 'jpg', 'png', 'svg', 'webp'],
			defaultValue: ''
		},
		{
			name: 'backgroundImageDisplayMode',
			type: 'string',
			enum: ['cover', 'contain'],
			defaultValue: 'cover',
			helperText: 'Cover: fills the space (may crop), Contain: shows full image'
		}
	]
};
