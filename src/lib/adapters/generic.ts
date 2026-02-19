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

  generateReaderUrl(externalId: string, slug?: string): string {
    return this.definition.readerUrlTemplate
      .replace('{externalId}', externalId)
      .replace('{slug}', slug || '-');
  }
}
