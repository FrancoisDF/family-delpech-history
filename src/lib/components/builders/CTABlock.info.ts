import type { ComponentInfo } from '@builder.io/sdk-svelte';
import CTABlock from './CTABlock.svelte';

export const ctaBlockInfo: ComponentInfo = {
	component: CTABlock,
	name: 'CTABlock',
	tag: 'Page Sections',
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
