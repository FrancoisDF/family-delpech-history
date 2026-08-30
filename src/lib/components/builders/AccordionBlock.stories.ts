import type { Meta, StoryObj } from '@storybook/sveltekit';
import { expect, userEvent, within } from 'storybook/test';
import AccordionBlock from './AccordionBlock.svelte';

const meta = {
	title: 'Builder Components/AccordionBlock',
	component: AccordionBlock,
	tags: ['autodocs'],
	argTypes: {
		title: { control: 'text' },
		sections: { control: 'object' },
		connectTop: { control: 'boolean' },
		connectBottom: { control: 'boolean' }
	}
} satisfies Meta<typeof AccordionBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const sections = [
	{
		name: 'Correspondances familiales',
		documents: [
			{
				name: 'Lettre de Marie à Pierre',
				description: 'Une lettre conservée dans les archives de 1904.',
				file: '/favicon.png',
				actionType: 'view' as const
			},
			{
				name: 'Carnet de voyage',
				description: 'Notes manuscrites et itinéraire.',
				file: '/favicon.png',
				actionType: 'download' as const
			}
		]
	},
	{ name: 'Photographies', documents: [] }
];

export const Default: Story = {
	args: { title: 'Documents des archives', sections, connectTop: false, connectBottom: false },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: 'Correspondances familiales' }));
		await expect(canvas.getByText('Lettre de Marie à Pierre')).toBeInTheDocument();
	}
};

export const ConnectedSections: Story = {
	args: { title: 'Documents associés', sections, connectTop: true, connectBottom: true }
};

export const Empty: Story = {
	args: { title: 'Aucun document', sections: [], connectTop: false, connectBottom: false }
};
