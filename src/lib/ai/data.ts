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

  // Builder ingestion / provenance
  isBuilderContent?: boolean;
  sourceType?: 'post' | 'attachment' | 'local-document';

  // If this chunk is (or comes from) a document referenced inside a Builder post
  originPostId?: string;
  originPostTitle?: string;
  originPostUrl?: string;
  originPostModel?: string;

  // If this chunk represents a downloaded attachment
  attachmentUrl?: string;
  attachmentFileName?: string;
}

let _cached: FamilyChunk[] | null = null;

export async function loadFamilyData(fetchFn?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>): Promise<FamilyChunk[]> {
  if (_cached) return _cached;
  try {
    const fetchToUse = fetchFn || fetch;
    const res = await fetchToUse('/family-data.json');
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
