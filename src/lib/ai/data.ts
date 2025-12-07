export interface FamilyChunk {
  id: string;
  sourceId: string;
  sourceModel: string;
  title: string;
  url: string;
  index: number;
  text: string;
  length: number;
  // Optional metadata fields (populated by local document ingester)
  author?: string;
  year?: string;
  category?: string;
  tags?: string[];
}

let _cached: FamilyChunk[] | null = null;

export async function loadFamilyData(): Promise<FamilyChunk[]> {
  if (_cached) return _cached;
  try {
    const res = await fetch('/family-data.json');
    if (!res.ok) throw new Error('Failed to load family-data.json');
    const data = (await res.json()) as FamilyChunk[];
    _cached = data;
    return data;
  } catch (err) {
    console.warn('Unable to load family data:', err);
    return [];
  }
}

export function clearFamilyDataCache() {
  _cached = null;
}
