const sections = [
	{
		id: 'section-1900',
		title: 'Le tournant du siècle',
		description:
			'Les premiers cahiers racontent une famille attentive aux changements de son époque.',
		audioUrl: '/favicon.png',
		year: 1900,
		tags: ['family-history'],
		blog: {
			id: 'article-1904',
			title: 'Le carnet de voyage de Marie',
			excerpt: 'Un récit retrouvé dans les archives familiales raconte le départ vers le sud.',
			date: '12 juin 1904',
			readTime: '6 min de lecture',
			featuredImage: '/logo-ddf.png',
			category: 'Correspondances',
			slug: 'le-carnet-de-voyage-de-marie'
		}
	},
	{
		id: 'section-1875',
		title: 'Une famille en mouvement',
		description:
			'Des lettres et des photographies éclairent les voyages entrepris par la famille Delpech.',
		audioUrl: '/favicon.png',
		year: 1875,
		tags: ['family-history', 'archives'],
		blog: null
	},
	{
		id: 'section-1820',
		title: 'La vie quotidienne',
		description:
			'Les documents conservés décrivent les métiers, les maisons et les traditions transmises.',
		audioUrl: '',
		year: 1820,
		tags: ['archives'],
		blog: {
			id: 'article-1821',
			title: 'Les métiers de nos ancêtres',
			excerpt:
				'Un inventaire permet de mieux comprendre le quotidien et les savoir-faire transmis.',
			date: '18 mars 1821',
			readTime: '8 min de lecture',
			featuredImage: '',
			category: 'Archives',
			slug: 'les-metiers-de-nos-ancetres'
		}
	}
];

export async function fetchSections() {
	return sections;
}
