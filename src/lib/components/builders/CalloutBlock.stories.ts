import type { Meta, StoryObj } from '@storybook/sveltekit';
import CalloutBlock from './CalloutBlock.svelte';

const meta = {
	title: 'Builder Components/CalloutBlock',
	component: CalloutBlock,
	tags: ['autodocs'],
	argTypes: {
		title: { control: 'text' },
		content: { control: 'text' },
		type: { control: 'select', options: ['info', 'warning', 'success', 'tip'] },
		icon: { control: 'select', options: ['info', 'warning', 'success', 'lightbulb'] },
		connectTop: { control: 'boolean' },
		connectBottom: { control: 'boolean' }
	}
} satisfies Meta<typeof CalloutBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const base = {
	title: 'À retenir',
	content: '<p>Les dates sont parfois approximatives : comparez toujours plusieurs sources.</p>',
	connectTop: false,
	connectBottom: false
};

export const Information: Story = { args: { ...base, type: 'info', icon: 'info' } };
export const Warning: Story = {
	args: { ...base, title: 'Source à vérifier', type: 'warning', icon: 'warning' }
};
export const Success: Story = {
	args: { ...base, title: 'Archive confirmée', type: 'success', icon: 'success' }
};
export const TipConnected: Story = {
	args: {
		...base,
		title: 'Astuce de recherche',
		type: 'tip',
		icon: 'lightbulb',
		connectTop: true,
		connectBottom: true
	}
};
