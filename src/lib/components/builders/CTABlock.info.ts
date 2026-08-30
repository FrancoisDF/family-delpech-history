import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import CTABlock from './CTABlock.svelte';

export const ctaBlockInfo: RegisteredComponent = {
	component: CTABlock as any,
	name: 'CTABlock',
	friendlyName: 'Appel à l’action',
	tag: 'Appel à l’action',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Vous Avez des Questions ?'
		},
		{
			name: 'description',
			type: 'string',
			defaultValue: 'Explorez nos archives complètes grâce à notre assistant IA.'
		},
		{
			name: 'buttonText',
			type: 'string',
			defaultValue: "Accéder à l'Assistant IA"
		},
		{
			name: 'buttonLink',
			type: 'string',
			defaultValue: '/chat'
		}
	]
};
