import type { StorybookConfig } from '@storybook/sveltekit';
import type { StorybookConfig } from '@storybook/sveltekit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/lib/components/builders/*.stories.ts'],
	addons: [
		'@chromatic-com/storybook',
		'@storybook/addon-vitest',
		'@storybook/addon-a11y',
		'@storybook/addon-docs'
	],
	framework: '@storybook/sveltekit',
	staticDirs: ['../static'],
	async viteFinal(config) {
		config.plugins = config.plugins || [];
		config.plugins.push({
			name: 'storybook-mock-remote',
			enforce: 'pre',
			resolveId(source) {
				if (source.includes('section.remote')) {
					return path.resolve(__dirname, '../src/mocks/section.mock.js');
				}
				if (source.includes('article.remote')) {
					return path.resolve(__dirname, '../src/mocks/article.mock.js');
				}
				return null;
			}
		});

		if (config.resolve) {
			// Ensure alias is an array for easier pushing
			if (!Array.isArray(config.resolve.alias)) {
				config.resolve.alias = Object.entries(config.resolve.alias || {}).map(
					([find, replacement]) => ({ find, replacement })
				);
			}
			// We keep these as backup
			config.resolve.alias.unshift(
				{
					find: /.*\/section\.remote(\.ts)?$/,
					replacement: path.resolve(__dirname, '../src/mocks/section.mock.js')
				},
				{
					find: /.*\/article\.remote(\.ts)?$/,
					replacement: path.resolve(__dirname, '../src/mocks/article.mock.js')
				},
				{
					find: '$lib/components/section.remote',
					replacement: path.resolve(__dirname, '../src/mocks/section.mock.js')
				},
				{
					find: '$lib/components/article.remote',
					replacement: path.resolve(__dirname, '../src/mocks/article.mock.js')
				}
			);
		}
		return config;
	}
};
export default config;
