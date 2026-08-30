import type { Meta, StoryObj } from '@storybook/sveltekit';
import StorySectionCard from './StorySectionCard.svelte';

const meta = {
	title: 'Builder Components/StorySectionCard',
	component: StorySectionCard,
	tags: ['autodocs'],
	argTypes: {
		title: { control: 'text' },
		description: { control: 'text' },
		audioUrl: { control: 'text' },
		videoUrl: { control: 'text' },
		year: { control: 'number' }
	}
} satisfies Meta<typeof StorySectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAudio: Story = {
	args: {
		title: 'Le tournant du siècle',
		description:
			'Les premiers cahiers racontent une famille attentive aux changements de son époque.',
		audioUrl: '/favicon.png',
		year: 1900
	}
};
export const TextOnly: Story = {
	args: {
		title: 'La vie quotidienne',
		description: 'Les documents conservés décrivent les métiers et les traditions transmises.',
		audioUrl: '',
		year: 1820
	}
};
