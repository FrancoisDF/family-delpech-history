import type { Meta, StoryObj } from '@storybook/svelte';
import ImageBlock from './ImageBlock.svelte';

const meta = {
	title: 'Builder Components/ImageBlock',
	component: ImageBlock,
	tags: ['autodocs'],
	argTypes: {
		imageUrl: {
			control: 'text',
			description: 'URL of the image to display'
		},
		imageAlt: {
			control: 'text',
			description: 'Alternative text for the image'
		},
		caption: {
			control: 'text',
			description: 'Caption text below the image'
		},
		imageSize: {
			control: 'select',
			options: ['small', 'medium', 'large', 'full'],
			description: 'Size of the image container'
		},
		alignment: {
			control: 'select',
			options: ['left', 'center', 'right'],
			description: 'Alignment of the image'
		},
		imageDisplayMode: {
			control: 'select',
			options: ['cover', 'contain'],
			description: 'How the image fills the container'
		},
		roundedCorners: {
			control: 'boolean',
			description: 'Whether to apply rounded corners'
		},
		connectTop: {
			control: 'boolean',
			description: 'Remove top padding to connect with element above'
		},
		connectBottom: {
			control: 'boolean',
			description: 'Remove bottom padding to connect with element below'
		}
	}
} satisfies Meta<ImageBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
		imageAlt: 'Beautiful landscape',
		caption: '',
		imageSize: 'large',
		alignment: 'center',
		imageDisplayMode: 'cover',
		roundedCorners: true,
		connectTop: false,
		connectBottom: false
	}
};

export const WithCaption: Story = {
	args: {
		imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
		imageAlt: 'Family photo',
		caption: 'A moment captured in time - The Delpech family, 1925',
		imageSize: 'medium',
		alignment: 'center',
		imageDisplayMode: 'cover',
		roundedCorners: true,
		connectTop: false,
		connectBottom: false
	}
};

export const NoImage: Story = {
	args: {
		imageUrl: '',
		imageAlt: '',
		caption: 'Placeholder image',
		imageSize: 'medium',
		alignment: 'center',
		imageDisplayMode: 'cover',
		roundedCorners: true,
		connectTop: false,
		connectBottom: false
	}
};

export const SmallLeftAligned: Story = {
	args: {
		imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
		imageAlt: 'Portrait',
		caption: '',
		imageSize: 'small',
		alignment: 'left',
		imageDisplayMode: 'contain',
		roundedCorners: false,
		connectTop: false,
		connectBottom: false
	}
};
