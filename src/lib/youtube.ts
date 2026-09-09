export function getYouTubeEmbedUrl(value: string): string {
	const input = value.trim();
	if (!input) return '';

	try {
		const url = new URL(input);
		const host = url.hostname.replace(/^www\./, '').toLowerCase();
		let videoId = '';

		if (host === 'youtu.be') {
			videoId = url.pathname.slice(1).split('/')[0] || '';
		} else if (host === 'youtube.com' || host === 'm.youtube.com') {
			if (url.pathname === '/watch') {
				videoId = url.searchParams.get('v') || '';
			} else if (url.pathname.startsWith('/embed/')) {
				videoId = url.pathname.split('/')[2] || '';
			} else if (url.pathname.startsWith('/shorts/')) {
				videoId = url.pathname.split('/')[2] || '';
			}
		}

		if (!videoId) return '';
		const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
		const start = url.searchParams.get('start') || url.searchParams.get('t');
		if (start && /^\d+$/.test(start)) embedUrl.searchParams.set('start', start);
		return embedUrl.toString();
	} catch {
		return '';
	}
}
