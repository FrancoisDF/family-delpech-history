import { fetchBuilderContentServer } from '$lib/server/builder';
import { query } from '$app/server';

interface BlogPost {
	id: string;
	title: string;
	excerpt?: string;
	date?: string;
	readTime?: string;
	featuredImage?: string;
	category?: string;
	slug?: string;
	tags?: any[];
}

interface StorySection {
	id: string;
	title: string;
	description: string;
	audioUrl: string;
	videoUrl: string;
	year: number;
	tags: string[];
	blog?: BlogPost | null;
}

const loadSections = async (storySectionsRaw: any[]): Promise<StorySection[]> => {
	try {
		const storySections = storySectionsRaw
			.map((section: any) => {
				const blog = section.data?.blog;
				return {
					id: section.id,
					title: section.data?.title || '',
					description: section.data?.description || '',
					audioUrl: section.data?.audioUrl || '',
					videoUrl: section.data?.videoUrl || '',
					year: Number(section.data?.year ?? 1800),
					tags: section.data?.tags,
					blog: blog
						? {
								id: blog.id || blog.value?.id,
								title: blog.title || blog.value?.data?.title || '',
								excerpt: blog.excerpt || blog.value?.data?.excerpt || '',
								date: blog.date || blog.value?.data?.date || '',
								readTime: blog.readTime || blog.value?.data?.readTime || '',
								featuredImage: blog.featuredImage || blog.value?.data?.featuredImage || '',
								category: blog.category || blog.value?.data?.category || '',
								slug: blog.slug || blog.value?.data?.slug || '',
								tags: blog.tags || blog.value?.data?.tags || []
							}
						: null
				};
			})
			.sort((a, b) => a.year - b.year);

		return storySections;
	} catch (error) {
		console.error('Error processing sections:', error);
		return [];
	}
};

export const fetchSections = query(async (): Promise<StorySection[] | undefined> => {
	try {
		const storySectionsRaw = await fetchBuilderContentServer('stories', { limit: 100 });
		return loadSections(storySectionsRaw);
	} catch (error) {
		console.error('Error fetching sections:', error);
		return;
	}
});
