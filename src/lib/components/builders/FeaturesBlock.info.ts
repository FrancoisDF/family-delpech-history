import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import FeaturesBlock from './FeaturesBlock.svelte';

export const featuresBlockInfo: RegisteredComponent = {
	component: FeaturesBlock as any,
	name: 'FeaturesBlock',
	tag: 'Features & Benefits',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Faits Intéressants'
		},
		{
			name: 'features',
			type: 'list',
			defaultValue: [],
			subFields: [
				{
					name: 'number',
					type: 'string',
					defaultValue: '01'
				},
				{
					name: 'title',
					type: 'string',
					defaultValue: 'Feature Title'
				},
				{
					name: 'description',
					type: 'string',
					defaultValue: 'Feature description'
				}
			]
		}
	]
};
