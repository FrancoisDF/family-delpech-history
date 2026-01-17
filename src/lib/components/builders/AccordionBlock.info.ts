import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import AccordionBlock from './AccordionBlock.svelte';

export const accordionBlockInfo: RegisteredComponent = {
	component: AccordionBlock as any,
	name: 'AccordionBlock',
	tag: 'Accordion block',
	inputs: [
		{
			name: 'title',
			type: 'string',
			defaultValue: 'Documents'
		},
		{
			name: 'sections',
			type: 'list',
			defaultValue: [],
			subFields: [
				{
					name: 'name',
					type: 'string',
					defaultValue: 'Document Section'
				},
				{
					name: 'documents',
					type: 'list',
					defaultValue: [],
					subFields: [
						{
							name: 'name',
							type: 'string',
							defaultValue: 'Document Name'
						},
						{
							name: 'description',
							type: 'longText',
							defaultValue: '',
							helperText: 'Brief description or summary of the document'
						},
						{
							name: 'file',
							type: 'file',
							allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
							defaultValue: ''
						},
						{
							name: 'actionType',
							type: 'string',
							enum: ['view', 'download'],
							defaultValue: 'view',
							helperText: 'View: Opens in modal, Download: Direct download'
						}
					]
				}
			]
		},
		{
			name: 'connectTop',
			type: 'boolean',
			defaultValue: false,
			helperText: 'Remove top spacing to connect with section above'
		},
		{
			name: 'connectBottom',
			type: 'boolean',
			defaultValue: false,
			helperText: 'Remove bottom spacing to connect with section below'
		}
	]
};
