import type { Meta, StoryObj } from '@storybook/svelte';
import GenealogyBlock from './GenealogyBlock.svelte';

const meta = {
	title: 'Builder Components/GenealogyBlock',
	component: GenealogyBlock,
	tags: ['autodocs']
} satisfies Meta<GenealogyBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
