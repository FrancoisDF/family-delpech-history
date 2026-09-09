import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({ PUBLIC_BUILDER_API_KEY: { public: true, static: true } });
