import { Builder } from '@builder.io/sdk';
import { builderComponents } from './components/builders';

// Register each component with Builder so it renders correctly and shows up in the editor.
// The Svelte SDK typings don't currently model our `component` field, so we cast safely.
builderComponents.forEach((componentInfo) => {
	const component = (componentInfo as any).component;
	if (!component) return;

	try {
		(Builder as any).registerComponent(component, componentInfo as any);
	} catch (err) {
		console.warn('Builder registration failed for', (componentInfo as any).name, err);
	}
});
