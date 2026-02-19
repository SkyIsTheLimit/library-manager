import Dexie, { type Table } from 'dexie';
import { AdapterDefinition } from '../adapters/types';

export interface Book {
  id: string;
  externalId: string;
  source: string;
  slug?: string;
  title: string;
  author: string;
  coverUrl: string;
  readerUrl: string;
  dateAdded: number;
  updatedAt: number;
  deleted?: boolean;
}

export interface Progress {
  id: string;
  bookId: string; // externalId
  currentChapterUrl: string;
  currentChapterTitle: string;
  percentComplete: number;
  lastAccessed: number;
  updatedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  bookIds: string[]; // array of externalIds
  updatedAt: number;
  deleted?: boolean;
}

export interface SyncMetadata {
  id: string;
  lastSyncTime: number;
}

export class LibraryDatabase extends Dexie {
  books!: Table<Book>;
  progress!: Table<Progress>;
  playlists!: Table<Playlist>;
  adapters!: Table<AdapterDefinition & { updatedAt: number; deleted?: boolean }>;
  syncMetadata!: Table<SyncMetadata>;

  constructor() {
    super('LibraryManagerDB_v2'); // Changed database name to avoid primary key upgrade error
    this.version(1).stores({
      books: 'id, externalId, source, title, author, dateAdded, updatedAt, deleted',
      progress: 'id, bookId, lastAccessed, updatedAt',
      playlists: 'id, name, updatedAt, deleted',
      adapters: 'id, name, updatedAt, deleted',
      syncMetadata: 'id'
    });
  }

  async clearAll() {
    return this.transaction("rw", [this.books, this.progress, this.playlists, this.adapters, this.syncMetadata], async () => {
      await this.books.clear();
      await this.progress.clear();
      await this.playlists.clear();
      await this.adapters.clear();
      await this.syncMetadata.clear();
    });
  }
}

export const db = new LibraryDatabase();

// Helper to generate IDs
export const generateId = () => crypto.randomUUID();
