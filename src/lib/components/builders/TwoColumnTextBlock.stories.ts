import type { Meta, StoryObj } from '@storybook/sveltekit';
import TwoColumnTextBlock from './TwoColumnTextBlock.svelte';

const meta = {
	title: 'Builder Components/TwoColumnTextBlock',
	component: TwoColumnTextBlock,
	tags: ['autodocs'],
	argTypes: {
		title: { control: 'text' },
		leftContent: { control: 'text' },
		rightContent: { control: 'text' },
		connectTop: { control: 'boolean' },
		connectBottom: { control: 'boolean' }
	}
} satisfies Meta<typeof TwoColumnTextBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const content = {
	title: 'Deux regards sur une même histoire',
	leftContent: 'Les lettres racontent les départs, les métiers et les liens entre les villages.',
	rightContent:
		'Les photographies complètent ces récits avec les visages et les lieux de chaque époque.'
};

export const Default: Story = { args: { ...content, connectTop: false, connectBottom: false } };
export const Connected: Story = {
	args: { ...content, title: '', connectTop: true, connectBottom: true }
};
