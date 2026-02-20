import { BookAdapter, BookMetadata, AdapterDefinition } from './types';

export class GenericAdapter implements BookAdapter {
  id: string;
  name: string;
  definition: AdapterDefinition;

  constructor(def: AdapterDefinition) {
    this.id = def.id;
    this.name = def.name;
    this.definition = def;
  }

  matches(url: string): boolean {
    const regex = new RegExp(this.definition.urlMatchPattern, 'i');
    return regex.test(url);
  }

  async fetchMetadata(url: string): Promise<BookMetadata | null> {
    try {
      // Use the proxy endpoint to avoid CORS on the client
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch book metadata from ${this.name}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const getMetaContent = (selector: string) => {
        if (!selector) return null;
        try {
          const el = doc.querySelector(selector);
          return el ? (el.getAttribute('content') || el.textContent) : null;
        } catch (e) {
          return null;
        }
      };

      const title = getMetaContent(this.definition.titleSelector || 'meta[property="og:title"]') || doc.title || '';
      const author = getMetaContent(this.definition.authorSelector || 'meta[name="author"]') || '';
      const coverUrl = getMetaContent(this.definition.coverSelector || 'meta[property="og:image"]') || '';
      
      // Extract ID and Slug from URL
      let externalId = '';
      if (this.definition.idRegex) {
        const idMatch = url.match(new RegExp(this.definition.idRegex));
        if (idMatch && idMatch[1]) externalId = idMatch[1];
      } else {
        const parts = url.split('/');
        externalId = parts.filter(p => p.length >= 10 && /^\d+$/.test(p))[0] || '';
      }
      
      let slug = '';
      if (this.definition.slugRegex) {
        const slugMatch = url.match(new RegExp(this.definition.slugRegex));
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
        source: this.id
      };
    } catch (error) {
      console.error(`Error fetching metadata with ${this.name} adapter:`, error);
      return null;
    }
  }

  generateReaderUrl(externalId: string, slug?: string): string {
    return this.definition.readerUrlTemplate
      .replace('{externalId}', externalId)
      .replace('{slug}', slug || '-');
  }
}
