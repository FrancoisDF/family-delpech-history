import { PUBLIC_BUILDER_API_KEY } from '$app/env/public';
import {
	fetchChroniquesReferencingArticleServer,
	findContentIdByHandleServer
} from '#lib/server/builder.js';
import { articleUrl } from '#lib/url-utils.js';
import { fetchOneEntry, getBuilderSearchParams } from '@builder.io/sdk-svelte';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	let post;
	let id: string | null = null;
	try {
		id =
			(await findContentIdByHandleServer('blog-articles', params.id)) ||
			params.id.match(/^([a-f\d]{32})(?:-|$)/i)?.[1] ||
			null;
		post = id
			? await fetchOneEntry({
					model: 'blog-articles',
					apiKey: PUBLIC_BUILDER_API_KEY,
					options: {
						...getBuilderSearchParams(url.searchParams),
						query: { id }
					}
				})
			: null;
	} catch (error) {
		console.error('Error loading blog post:', error);
		post = null;
	}

	if (post && id) {
		const canonical = articleUrl(id, post.data?.title || post.name || id, post.data?.handle, post.data?.slug);
		if (canonical !== `/histoires/${encodeURIComponent(params.id)}`) {
			redirect(308, `${canonical}${url.search}`);
		}
	}

	return {
		post,
		chroniques: post && id ? await fetchChroniquesReferencingArticleServer(id) : []
	};
};
