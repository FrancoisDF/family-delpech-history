import type { Meta, StoryObj } from '@storybook/sveltekit';
import ImageGalleryBlock from './ImageGalleryBlock.svelte';

const meta = {
	title: 'Builder Components/ImageGalleryBlock',
	component: ImageGalleryBlock,
	tags: ['autodocs'],
	argTypes: {
		title: { control: 'text' },
		images: { control: 'object' },
		columns: { control: 'select', options: [2, 3, 4] },
		viewMode: { control: 'select', options: ['grid', 'carousel'] },
		connectTop: { control: 'boolean' },
		connectBottom: { control: 'boolean' }
	}
} satisfies Meta<typeof ImageGalleryBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const images = [
	{
		url: '/logo-ddf.png',
		alt: 'Archives familiales',
		caption: 'Les archives',
		description: '<p>Documents conservés par la famille.</p>',
		imageDisplayMode: 'contain'
	},
	{
		url: '/favicon.png',
		alt: 'Emblème',
		caption: 'Un symbole transmis',
		description: '<p>Un détail de notre histoire.</p>',
		imageDisplayMode: 'contain'
	},
	{
		url: '/logo-ddf.png',
		alt: 'Collection',
		caption: 'Une collection patiemment réunie',
		description: '<p>Chaque image ouvre une nouvelle piste.</p>',
		imageDisplayMode: 'contain'
	}
];

export const Grid: Story = {
	args: {
		title: 'Galerie de photos',
		images,
		columns: 3,
		viewMode: 'grid',
		connectTop: false,
		connectBottom: false
	}
};
export const Carousel: Story = {
	args: {
		title: 'Collection à parcourir',
		images: [...images, ...images],
		columns: 3,
		viewMode: 'carousel',
		connectTop: false,
		connectBottom: false
	}
};
export const Empty: Story = {
	args: {
		title: 'Galerie vide',
		images: [],
		columns: 3,
		viewMode: 'carousel',
		connectTop: false,
		connectBottom: false
	}
};
