import { db, Book, Playlist, Progress, generateId } from '../database/dexie';
import { syncService } from '../sync';
import { getAdapterForUrl, getAdapterById } from '../adapters';

export const libraryService = {
  async fetchBookMetadata(url: string, adapterId?: string) {
    const adapter = adapterId ? await getAdapterById(adapterId) : await getAdapterForUrl(url);
    if (!adapter) {
      console.error('No adapter found for URL:', url);
      return null;
    }
    return await adapter.fetchMetadata(url);
  },

  async deleteBook(id: string, externalId: string) {
    return db.transaction('rw', [db.books, db.progress, db.playlists], async () => {
      // Soft delete for sync
      await db.books.update(id, { 
        deleted: true, 
        updatedAt: Date.now() 
      });
      
      const playlists = await db.playlists.toArray();
      for (const playlist of playlists) {
        if (playlist.bookIds.includes(externalId)) {
          await db.playlists.update(playlist.id, {
            bookIds: playlist.bookIds.filter((bid) => bid !== externalId),
            updatedAt: Date.now()
          });
        }
      }
      syncService.triggerSync();
    });
  },

  async updateProgress(bookId: string, data: Partial<Omit<Progress, 'id' | 'bookId'>>) {
    const existing = await db.progress.where('bookId').equals(bookId).first();
    const now = Date.now();
    let result;
    if (existing) {
      result = await db.progress.update(existing.id, {
        ...data,
        lastAccessed: now,
        updatedAt: now,
      });
    } else {
      result = await db.progress.add({
        id: generateId(),
        bookId,
        currentChapterUrl: data.currentChapterUrl || '',
        currentChapterTitle: data.currentChapterTitle || '',
        percentComplete: data.percentComplete || 0,
        lastAccessed: now,
        updatedAt: now,
      } as Progress);
    }
    syncService.triggerSync();
    return result;
  },

  async updateLastAccessed(bookId: string) {
    const existing = await db.progress.where('bookId').equals(bookId).first();
    const now = Date.now();
    let result;
    if (existing) {
      result = await db.progress.update(existing.id, { 
        lastAccessed: now,
        updatedAt: now
      });
    } else {
      result = await db.progress.add({
        id: generateId(),
        bookId,
        currentChapterUrl: '',
        currentChapterTitle: '',
        percentComplete: 0,
        lastAccessed: now,
        updatedAt: now,
      } as Progress);
    }
    syncService.triggerSync();
    return result;
  },

  async toggleBookInPlaylist(playlistId: string, externalId: string) {
    const playlist = await db.playlists.get(playlistId);
    if (!playlist) return;

    const isBookInPlaylist = playlist.bookIds.includes(externalId);
    const now = Date.now();
    const newBookIds = isBookInPlaylist
      ? playlist.bookIds.filter((id) => id !== externalId)
      : [...playlist.bookIds, externalId];

    const result = await db.playlists.update(playlistId, { 
      bookIds: newBookIds,
      updatedAt: now
    });
    syncService.triggerSync();
    return result;
  },

  async updatePlaylist(id: string, data: Partial<Omit<Playlist, 'id'>>) {
    const result = await db.playlists.update(id, {
      ...data,
      updatedAt: Date.now()
    });
    syncService.triggerSync();
    return result;
  },

  async deletePlaylist(id: string) {
    // Soft delete for sync
    const result = await db.playlists.update(id, {
      deleted: true,
      updatedAt: Date.now()
    });
    syncService.triggerSync();
    return result;
  }
};
