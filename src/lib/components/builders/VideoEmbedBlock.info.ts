import type { ComponentInfo } from '@builder.io/sdk-svelte';
import VideoEmbedBlock from './VideoEmbedBlock.svelte';

export const videoEmbedBlockInfo: ComponentInfo = {
	component: VideoEmbedBlock,
	name: 'VideoEmbedBlock',
	tag: 'Article Content',
	inputs: [
		{
			name: 'videoUrl',
			type: 'string',
			defaultValue: '',
			helperText: 'YouTube embed URL (e.g., https://www.youtube.com/embed/VIDEO_ID)'
		},
		{
			name: 'title',
			type: 'string',
			defaultValue: ''
		},
		{
			name: 'caption',
			type: 'string',
			defaultValue: ''
		},
		{
			name: 'aspectRatio',
			type: 'string',
			enum: ['16/9', '4/3', '1/1'],
			defaultValue: '16/9'
		}
	]
};
