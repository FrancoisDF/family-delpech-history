import type { Meta, StoryObj } from '@storybook/sveltekit';
import TimelineBlock from './TimelineBlock.svelte';

const meta = {
	title: 'Builder Components/TimelineBlock',
	component: TimelineBlock,
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen' },
	argTypes: {
		title: { control: 'text' },
		description: { control: 'text' },
		showProgression: { control: 'boolean' }
	}
} satisfies Meta<typeof TimelineBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithProgression: Story = {
	args: {
		title: 'Un voyage à travers le temps',
		description:
			'Écoutez et suivez votre progression à travers les différentes périodes de notre histoire.',
		showProgression: true
	}
};

export const WithoutProgression: Story = {
	args: {
		title: 'Chronologie familiale',
		description: 'Les grandes étapes de notre histoire.',
		showProgression: false
	}
};
