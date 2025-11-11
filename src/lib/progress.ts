export interface StoryProgress {
	completedSections: string[];
	lastListenedId: string | null;
	lastUpdated: number;
}

const STORAGE_KEY = 'storyProgress';

export function getProgress(): StoryProgress {
	if (typeof window === 'undefined') {
		return {
			completedSections: [],
			lastListenedId: null,
			lastUpdated: 0
		};
	}

	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) {
		return {
			completedSections: [],
			lastListenedId: null,
			lastUpdated: 0
		};
	}

	try {
		return JSON.parse(stored);
	} catch {
		return {
			completedSections: [],
			lastListenedId: null,
			lastUpdated: 0
		};
	}
}

export function saveProgress(progress: StoryProgress): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function markSectionCompleted(sectionId: string): void {
	const progress = getProgress();
	if (!progress.completedSections.includes(sectionId)) {
		progress.completedSections.push(sectionId);
	}
	progress.lastListenedId = sectionId;
	progress.lastUpdated = Date.now();
	saveProgress(progress);
	// Dispatch event to notify components of progress change
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('progressUpdated', { detail: { sectionId } }));
	}
}

export function isSectionCompleted(sectionId: string): boolean {
	const progress = getProgress();
	return progress.completedSections.includes(sectionId);
}

export function unmarkSectionCompleted(sectionId: string): void {
	const progress = getProgress();
	progress.completedSections = progress.completedSections.filter((id) => id !== sectionId);
	progress.lastUpdated = Date.now();
	saveProgress(progress);
	// Dispatch event to notify components of progress change
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('progressUpdated', { detail: { sectionId } }));
	}
}

export function getLastListenedId(): string | null {
	const progress = getProgress();
	return progress.lastListenedId;
}
