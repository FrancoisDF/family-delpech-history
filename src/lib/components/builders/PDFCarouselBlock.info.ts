import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import PDFCarouselBlock from './PDFCarouselBlock.svelte';

export const pdfCarouselBlockInfo: RegisteredComponent = {
	component: PDFCarouselBlock as any,
	name: 'PDFCarouselBlock',
	tag: 'PDF Carousel',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Documents',
			required: false
		},
		{
			name: 'description',
			type: 'longText',
			defaultValue: '',
			required: false
		},
		{
			name: 'pdfs',
			type: 'list',
			defaultValue: [],
			required: false,
			subFields: [
				{
					name: 'id',
					type: 'string'
				},
				{
					name: 'title',
					type: 'string',
					required: true
				},
				{
					name: 'description',
					type: 'longText',
					required: false
				},
				{
					name: 'pdfFile',
					type: 'file',
					required: true,
					allowedFileTypes: ['pdf']
				}
			]
		}
	]
};
