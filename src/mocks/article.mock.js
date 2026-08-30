const articles = [
	{
		id: 'article-1904',
		title: 'Le carnet de voyage de Marie',
		excerpt: 'Un récit retrouvé dans les archives familiales raconte le départ vers le sud.',
		date: '12 juin 1904',
		readTime: '6 min de lecture',
		featuredImage: '/logo-ddf.png',
		category: 'Correspondances',
		slug: 'le-carnet-de-voyage-de-marie',
		tags: [{ tag: { id: 'family-history' } }]
	},
	{
		id: 'article-1878',
		title: 'Une maison, trois générations',
		excerpt: 'La maison de pierre a conservé les traces de plusieurs générations Delpech.',
		date: '3 septembre 1878',
		readTime: '4 min de lecture',
		featuredImage: '/logo-ddf.png',
		category: 'Patrimoine',
		slug: 'une-maison-trois-generations',
		tags: [{ tag: { id: 'family-history' } }]
	},
	{
		id: 'article-1821',
		title: 'Les métiers de nos ancêtres',
		excerpt: 'Un inventaire permet de mieux comprendre le quotidien et les savoir-faire transmis.',
		date: '18 mars 1821',
		readTime: '8 min de lecture',
		featuredImage: '',
		category: 'Archives',
		slug: 'les-metiers-de-nos-ancetres',
		tags: [{ tag: { id: 'archives' } }]
	}
];

export async function fetchArticleById() {
	return articles[0] ?? null;
}

export async function fetchArticles() {
	return articles;
}

/** @param {string[]} tagIds */
export async function fetchArticlesByTags(tagIds = []) {
	return tagIds.length > 0 ? articles : [];
}

export async function fetchRelatedArticles() {
	return articles;
}
