import { json } from '@sveltejs/kit';
import { getGEDCOMPeople, getGEDCOMStatistics } from '$lib/gedcom';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Get people data (loaded from static JSON generated at build time)
		const people = await getGEDCOMPeople();

		if (people.length === 0) {
			return json(
				{
					success: false,
					message: 'No genealogy data available. Please ensure GEDCOM file is processed at build time.',
					people: [],
					statistics: null
				},
				{ status: 404 }
			);
		}

		// Get statistics
		const statistics = getGEDCOMStatistics();

		return json({
			success: true,
			message: 'Genealogy data retrieved successfully',
			people,
			statistics,
			count: people.length
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		console.error('Error retrieving genealogy data:', error);

		return json(
			{
				success: false,
				message: 'Failed to retrieve genealogy data',
				error: message,
				people: [],
				statistics: null
			},
			{ status: 500 }
		);
	}
};
