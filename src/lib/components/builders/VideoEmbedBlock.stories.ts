import type { Meta, StoryObj } from '@storybook/svelte';
import VideoEmbedBlock from './VideoEmbedBlock.svelte';

const meta = {
	title: 'Builder Components/VideoEmbedBlock',
	component: VideoEmbedBlock,
	tags: ['autodocs']
} satisfies Meta<VideoEmbedBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
