import { registerComponent } from '@builder.io/sdk-svelte';
import { builderComponents } from './components/builders';

builderComponents.forEach((componentInfo) => {
	registerComponent(componentInfo.component, componentInfo);
});
