import type { Meta, StoryObj } from '@storybook/sveltekit';
import VideoEmbedBlock from './VideoEmbedBlock.svelte';

const meta = {
	title: 'Builder Components/VideoEmbedBlock',
	component: VideoEmbedBlock,
	tags: ['autodocs'],
	argTypes: {
		videoUrl: { control: 'text' },
		title: { control: 'text' },
		caption: { control: 'text' },
		aspectRatio: { control: 'select', options: ['16/9', '4/3', '1/1'] },
		connectTop: { control: 'boolean' },
		connectBottom: { control: 'boolean' }
	}
} satisfies Meta<typeof VideoEmbedBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {
	args: {
		videoUrl: '',
		title: 'Récit vidéo',
		caption: 'Ajoutez un lien vidéo dans Builder.io.',
		aspectRatio: '16/9',
		connectTop: false,
		connectBottom: false
	}
};
export const Embedded: Story = {
	args: {
		videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
		title: 'Un témoignage familial',
		caption: 'Un exemple de vidéo intégrée.',
		aspectRatio: '16/9',
		connectTop: true,
		connectBottom: false
	}
};
