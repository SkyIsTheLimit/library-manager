import { getAdapterForUrl, getAdapterById } from './adapters';

export async function fetchBookMetadata(url: string, adapterId?: string) {
  const adapter = adapterId ? await getAdapterById(adapterId) : await getAdapterForUrl(url);
  if (!adapter) {
    console.error('No adapter found for URL:', url);
    return null;
  }

  return await adapter.fetchMetadata(url);
}
