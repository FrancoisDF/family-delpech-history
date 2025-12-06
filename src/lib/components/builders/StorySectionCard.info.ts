import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import StorySectionCard from './StorySectionCard.svelte';

export const storySectionCardInfo: RegisteredComponent = {
	component: StorySectionCard,
	name: 'StorySectionCard',
	tag: 'Story Section Card',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Section Title',
			required: true
		},
		{
			name: 'description',
			type: 'string',
			defaultValue: 'Section description goes here',
			required: true
		},
		{
			name: 'year',
			type: 'number',
			defaultValue: 1800,
			required: true
		},
		{
			name: 'audioUrl',
			type: 'file',
			allowedFileTypes: ['mp3', 'wav', 'ogg', 'mpeg'],
			defaultValue: '',
			required: false
		}
	]
};
