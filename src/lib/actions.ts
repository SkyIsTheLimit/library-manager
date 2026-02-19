import * as cheerio from 'cheerio';
import { getAdapterForUrl, getAdapterById, type AdapterDefinition } from './adapters';

export async function fetchBookMetadata(url: string, adapterId?: string) {
  // Now running on client, so this will work!
  const adapter = adapterId ? await getAdapterById(adapterId) : await getAdapterForUrl(url);
  if (!adapter) {
    console.error('No adapter found for URL:', url);
    return null;
  }

  try {
    // Use the proxy endpoint to avoid CORS on the client
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch book metadata from ${adapter.name}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title, author, cover using selectors from definition or defaults
    const def: Partial<AdapterDefinition> = adapter.definition || {
      titleSelector: 'meta[property="og:title"]',
      authorSelector: 'meta[name="author"]',
      coverSelector: 'meta[property="og:image"]'
    };

    const title = $(def.titleSelector || 'meta[property="og:title"]').attr('content') || $('title').text() || '';
    const author = $(def.authorSelector || 'meta[name="author"]').attr('content') || '';
    const coverUrl = $(def.coverSelector || 'meta[property="og:image"]').attr('content') || '';
    
    // Extract ID and Slug from URL
    let externalId = '';
    if (def.idRegex) {
      const idMatch = url.match(new RegExp(def.idRegex));
      if (idMatch && idMatch[1]) externalId = idMatch[1];
    } else {
      const parts = url.split('/');
      externalId = parts.filter(p => p.length >= 10 && /^\d+$/.test(p))[0] || '';
    }
    
    let slug = '';
    if (def.slugRegex) {
      const slugMatch = url.match(new RegExp(def.slugRegex));
      if (slugMatch && slugMatch[1]) slug = slugMatch[1];
    } else {
      const parts = url.split('/');
      const viewIndex = parts.indexOf('view');
      if (viewIndex !== -1 && parts[viewIndex + 1] !== externalId) {
        slug = parts[viewIndex + 1];
      }
    }

    return {
      title: title.replace(' [Book]', '').trim(),
      author,
      coverUrl,
      externalId,
      slug: slug || '-',
      source: adapter.id
    };
  } catch (error) {
    console.error(`Error fetching metadata with ${adapter.name} adapter:`, error);
    return null;
  }
}
