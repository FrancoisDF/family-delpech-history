import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import ArticleSectionBlock from './ArticleSectionBlock.svelte';

export const articleSectionBlockInfo: RegisteredComponent = {
	component: ArticleSectionBlock as any,
	name: 'ArticleSectionBlock',
	tag: 'Content Sections',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: ''
		},
		{
			name: 'content',
			type: 'richText',
			defaultValue: 'Votre contenu de section ici...'
		},
		{
			name: 'image',
			type: 'file',
			allowedFileTypes: ['jpeg', 'jpg', 'png', 'svg', 'webp'],
			defaultValue: ''
		},
		{
			name: 'imageAlt',
			type: 'string',
			defaultValue: ''
		},
		{
			name: 'imagePosition',
			type: 'string',
			enum: ['none', 'top', 'bottom', 'left', 'right'],
			defaultValue: 'none'
		},
		{
			name: 'imageDisplayMode',
			type: 'string',
			enum: ['cover', 'contain'],
			defaultValue: 'cover',
			helperText: 'Cover: fills the space (may crop), Contain: shows full image'
		},
		{
			name: 'backgroundColor',
			type: 'string',
			enum: ['bg-white', 'bg-primary-50', 'bg-cream'],
			defaultValue: 'bg-white'
		},
		{
			name: 'connectTop',
			type: 'boolean',
			defaultValue: false,
			helperText: 'Remove top spacing to connect seamlessly with section above'
		},
		{
			name: 'connectBottom',
			type: 'boolean',
			defaultValue: false,
			helperText: 'Remove bottom spacing to connect seamlessly with section below'
		}
	]
};
