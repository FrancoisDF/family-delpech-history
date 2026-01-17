import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import BlogGridBlock from './BlogGridBlock.svelte';

export const blogGridBlockInfo: RegisteredComponent = {
	component: BlogGridBlock as any,
	name: 'BlogGridBlock',
	tag: 'Content Grids',
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
			enum: [
				{ label: '2', value: 2 },
				{ label: '3', value: 3 },
				{ label: '4', value: 4 }
			]
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
