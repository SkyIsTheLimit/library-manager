import { db, Book, Playlist, Progress } from '../db';

export const libraryService = {
  async deleteBook(id: number, externalId: string) {
    return db.transaction('rw', [db.books, db.progress, db.playlists], async () => {
      await db.books.delete(id);
      await db.progress.where('bookId').equals(externalId).delete();
      
      const playlists = await db.playlists.toArray();
      for (const playlist of playlists) {
        if (playlist.bookIds.includes(externalId)) {
          await db.playlists.update(playlist.id!, {
            bookIds: playlist.bookIds.filter((bid) => bid !== externalId),
          });
        }
      }
    });
  },

  async updateProgress(bookId: string, data: Partial<Omit<Progress, 'id' | 'bookId'>>) {
    const existing = await db.progress.where('bookId').equals(bookId).first();
    if (existing) {
      return db.progress.update(existing.id!, {
        ...data,
        lastAccessed: Date.now(),
      });
    } else {
      return db.progress.add({
        bookId,
        currentChapterUrl: data.currentChapterUrl || '',
        currentChapterTitle: data.currentChapterTitle || '',
        percentComplete: data.percentComplete || 0,
        lastAccessed: Date.now(),
      } as Progress);
    }
  },

  async updateLastAccessed(bookId: string) {
    const existing = await db.progress.where('bookId').equals(bookId).first();
    if (existing) {
      return db.progress.update(existing.id!, { lastAccessed: Date.now() });
    } else {
      return db.progress.add({
        bookId,
        currentChapterUrl: '',
        currentChapterTitle: '',
        percentComplete: 0,
        lastAccessed: Date.now(),
      } as Progress);
    }
  },

  async toggleBookInPlaylist(playlistId: number, externalId: string) {
    const playlist = await db.playlists.get(playlistId);
    if (!playlist) return;

    const isBookInPlaylist = playlist.bookIds.includes(externalId);
    const newBookIds = isBookInPlaylist
      ? playlist.bookIds.filter((id) => id !== externalId)
      : [...playlist.bookIds, externalId];

    return db.playlists.update(playlistId, { bookIds: newBookIds });
  },

  async updatePlaylist(id: number, data: Partial<Omit<Playlist, 'id'>>) {
    return db.playlists.update(id, data);
  },

  async deletePlaylist(id: number) {
    return db.playlists.delete(id);
  }
};
