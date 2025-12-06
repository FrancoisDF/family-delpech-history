import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import DividerBlock from './DividerBlock.svelte';

export const dividerBlockInfo: RegisteredComponent = {
	component: DividerBlock,
	name: 'DividerBlock',
	tag: 'Layout & Spacing',
	inputs: [
		{
			name: 'style',
			type: 'string',
			enum: ['solid', 'dashed', 'decorative'],
			defaultValue: 'solid'
		},
		{
			name: 'thickness',
			type: 'string',
			enum: ['thin', 'medium', 'thick'],
			defaultValue: 'medium'
		},
		{
			name: 'spacing',
			type: 'string',
			enum: ['small', 'medium', 'large'],
			defaultValue: 'medium'
		}
	]
};
