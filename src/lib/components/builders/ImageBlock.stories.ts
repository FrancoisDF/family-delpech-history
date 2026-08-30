import type { Meta, StoryObj } from '@storybook/sveltekit';
import ImageBlock from './ImageBlock.svelte';

const meta = {
	title: 'Builder Components/ImageBlock',
	component: ImageBlock,
	tags: ['autodocs'],
	argTypes: {
		imageUrl: { control: 'text' },
		imageAlt: { control: 'text' },
		caption: { control: 'text' },
		imageSize: { control: 'select', options: ['small', 'medium', 'large', 'full'] },
		alignment: { control: 'select', options: ['left', 'center', 'right'] },
		imageDisplayMode: { control: 'select', options: ['cover', 'contain'] },
		roundedCorners: { control: 'boolean' },
		connectTop: { control: 'boolean' },
		connectBottom: { control: 'boolean' }
	}
} satisfies Meta<typeof ImageBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const base = {
	imageUrl: '/logo-ddf.png',
	imageAlt: 'Logo des archives familiales',
	caption: '',
	imageSize: 'large',
	alignment: 'center',
	imageDisplayMode: 'contain',
	roundedCorners: true,
	connectTop: false,
	connectBottom: false
};

export const Default: Story = { args: base };
export const WithCaption: Story = {
	args: {
		...base,
		caption: 'Les archives Delpech, une mémoire à transmettre.',
		imageSize: 'medium'
	}
};
export const Placeholder: Story = {
	args: {
		...base,
		imageUrl: '',
		imageAlt: '',
		caption: 'Image à ajouter dans Builder.io',
		roundedCorners: false
	}
};
export const Connected: Story = {
	args: { ...base, imageSize: 'small', alignment: 'right', connectTop: true, connectBottom: true }
};
