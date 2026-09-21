import { fetchBuilderContentServer } from '#lib/server/builder.js';
import { query } from '$app/server';
import { fetchChroniquesServer } from '#lib/server/builder.js';

interface ChroniqueSection {
	id: string;
	title: string;
	description: string;
	year: number;
	chroniqueHandle: string;
}

function getChroniqueYear(date: string | undefined, title: string): number {
	const match = `${date ?? ''} ${title}`.match(/\b(?:1[5-9]\d{2}|20\d{2})\b/);
	return match ? Number(match[0]) : 1800;
}

export const fetchSections = query(async (): Promise<ChroniqueSection[]> => {
	const chroniques = await fetchChroniquesServer();

	return chroniques
		.map((chronique) => ({
			id: chronique.id,
			title: chronique.title,
			description: chronique.excerpt ?? '',
			year: getChroniqueYear(chronique.date, chronique.title),
			chroniqueHandle: chronique.handle
		}))
		.sort((a, b) => a.year - b.year);
});
