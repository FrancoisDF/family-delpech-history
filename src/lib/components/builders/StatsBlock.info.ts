import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import StatsBlock from './StatsBlock.svelte';

export const statsBlockInfo: RegisteredComponent = {
	component: StatsBlock as any,
	name: 'StatsBlock',
	tag: 'Stats & Metrics',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Le Saviez-Vous ?'
		},
		{
			name: 'stats',
			type: 'list',
			defaultValue: [],
			subFields: [
				{
					name: 'value',
					type: 'string',
					defaultValue: '100+'
				},
				{
					name: 'label',
					type: 'string',
					defaultValue: 'Stat Label'
				},
				{
					name: 'description',
					type: 'string',
					defaultValue: ''
				}
			]
		},
		{
			name: 'columns',
			type: 'number',
			enum: [
				{ label: '2', value: 2 },
				{ label: '3', value: 3 },
				{ label: '4', value: 4 }
			],
			defaultValue: 3
		}
	]
};
