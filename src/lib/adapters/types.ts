export interface AdapterDefinition {
  id: string;
  name: string;
  urlMatchPattern: string; // Regex string
  readerUrlTemplate: string; // e.g. "https://proxy.com/view/{slug}/{externalId}/"
  
  // Metadata extraction rules
  titleSelector?: string;
  authorSelector?: string;
  coverSelector?: string;
  
  // URL extraction rules
  idRegex?: string;
  slugRegex?: string;
}

export interface BookMetadata {
  externalId: string;
  title: string;
  author: string;
  coverUrl: string;
  source: string;
  slug?: string;
}

export interface BookAdapter {
  id: string;
  name: string;
  definition?: AdapterDefinition;
  matches(url: string): boolean;
  fetchMetadata(url: string): Promise<BookMetadata | null>;
  generateReaderUrl(externalId: string, slug?: string): string;
}
