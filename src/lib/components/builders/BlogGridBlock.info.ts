import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import BlogGridBlock from './BlogGridBlock.svelte';

export const blogGridBlockInfo: RegisteredComponent = {
	component: BlogGridBlock,
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
			enum: [2, 3, 4]
		}
	]
};
