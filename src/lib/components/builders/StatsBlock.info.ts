import type { ComponentInfo } from '@builder.io/sdk-svelte';
import StatsBlock from './StatsBlock.svelte';

export const statsBlockInfo: ComponentInfo = {
	component: StatsBlock,
	name: 'StatsBlock',
	tag: 'Page Sections',
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
			enum: [2, 3, 4],
			defaultValue: 3
		}
	]
};
