import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import TimelineBlock from './TimelineBlock.svelte';

export const timelineBlockInfo: RegisteredComponent = {
	component: TimelineBlock,
	name: 'TimelineBlock',
	tag: 'Timeline & History',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Un Voyage à Travers le Temps'
		},
		{
			name: 'description',
			type: 'string',
			defaultValue:
				'Écoutez et suivez votre progression à travers les différentes périodes de notre histoire'
		},
		{
			name: 'sections',
			type: 'list',
			defaultValue: [],
			subFields: [
				{
					name: 'year',
					type: 'string'
				},
				{
					name: 'title',
					type: 'string'
				},
				{
					name: 'description',
					type: 'string'
				},
				{
					name: 'content',
					type: 'richText'
				}
			]
		}
	]
};
