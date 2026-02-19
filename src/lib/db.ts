import Dexie, { type Table } from 'dexie';
import { AdapterDefinition } from './adapters/types';

export interface Book {
  id?: number;
  externalId: string;
  source: string;
  slug?: string;
  title: string;
  author: string;
  coverUrl: string;
  readerUrl: string;
  dateAdded: number;
}

export interface Progress {
  id?: number;
  bookId: string; // externalId
  currentChapterUrl: string;
  currentChapterTitle: string;
  percentComplete: number;
  lastAccessed: number;
}

export interface Playlist {
  id?: number;
  name: string;
  description: string;
  bookIds: string[]; // array of externalIds
}

export class LibraryDatabase extends Dexie {
  books!: Table<Book>;
  progress!: Table<Progress>;
  playlists!: Table<Playlist>;
  adapters!: Table<AdapterDefinition>;

  constructor() {
    super('LibraryManagerDB');
    this.version(1).stores({
      books: '++id, externalId, source, title, author, dateAdded',
      progress: '++id, bookId, lastAccessed',
      playlists: '++id, name',
      adapters: '++id, id, name'
    });
  }
}

export const db = new LibraryDatabase();
