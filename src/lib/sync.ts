import { db, Book, Progress, Playlist, generateId } from "./database/dexie";
import { authClient } from "./auth-client";

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const syncService = {
  async sync(sessionData?: any) {
    // Only sync if tab is visible
    if (typeof document !== 'undefined' && document.hidden) {
      console.log("Tab hidden, skipping sync");
      return;
    }

    const session = sessionData || (await authClient.getSession()).data;
    if (!session) {
      console.log("No session found, skipping sync");
      return;
    }

    const lastSyncMeta = await db.syncMetadata.get("lastSyncTime");
    const lastSyncTime = lastSyncMeta?.lastSyncTime || 0;
    
    // 1. Get local changes since last sync
    const changedBooks = await db.books
      .where("updatedAt")
      .above(lastSyncTime)
      .toArray();
    const changedProgress = await db.progress
      .where("updatedAt")
      .above(lastSyncTime)
      .toArray();
    const changedPlaylists = await db.playlists
      .where("updatedAt")
      .above(lastSyncTime)
      .toArray();
    const changedAdapters = await db.adapters
      .where("updatedAt")
      .above(lastSyncTime)
      .toArray();

    // If no local changes and not a fresh sync, we can skip if we want, 
    // but we still want to pull remote changes occasionally.
    // However, for the "Hybrid" approach, we trigger this on specific events.

    const response = await fetch("/api/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        books: changedBooks,
        progress: changedProgress,
        playlists: changedPlaylists,
        adapters: changedAdapters,
        lastSyncTime,
      }),
    });

    if (!response.ok) return;

    const serverChanges = (await response.json()) as {
      books: Book[];
      progress: Progress[];
      playlists: Playlist[];
      adapters: any[];
      syncTime: number;
    };

    try {
      await db.transaction("rw", [db.books, db.progress, db.playlists, db.adapters, db.syncMetadata], async () => {
        for (const book of serverChanges.books) {
          const local = await db.books.get(book.id);
          if (!local || book.updatedAt > local.updatedAt) await db.books.put(book);
        }
        for (const p of serverChanges.progress) {
          const local = await db.progress.get(p.id);
          if (!local || p.updatedAt > local.updatedAt) await db.progress.put(p);
        }
        for (const pl of serverChanges.playlists) {
          const local = await db.playlists.get(pl.id);
          if (!local || pl.updatedAt > local.updatedAt) await db.playlists.put(pl);
        }
        for (const ad of serverChanges.adapters) {
          const local = await db.adapters.get(ad.id);
          if (!local || ad.updatedAt > local.updatedAt) await db.adapters.put(ad);
        }
        await db.syncMetadata.put({ id: "lastSyncTime", lastSyncTime: serverChanges.syncTime });
      });
    } catch (err) {
      console.error("Sync apply failed", err);
    }
  },

  // Debounced version for frequent updates like progress
  triggerSync: debounce(async function() {
    await syncService.sync();
  }, 2000), // 2 second debounce

  _visibilityListener: null as (() => void) | null,
  _beforeUnloadListener: null as (() => void) | null,

  async startAutoSync(sessionData?: any) {
    // 1. Sync immediately on load
    await this.sync(sessionData);

    // 2. Setup Visibility Change listener
    if (typeof document !== 'undefined' && !this._visibilityListener) {
      this._visibilityListener = () => {
        if (!document.hidden) {
          console.log("Tab focused, triggering sync");
          this.sync();
        }
      };
      document.addEventListener('visibilitychange', this._visibilityListener);
    }

    // 3. Setup beforeunload listener for final sync
    if (typeof window !== 'undefined' && !this._beforeUnloadListener) {
      this._beforeUnloadListener = () => {
        this.sync();
      };
      window.addEventListener('beforeunload', this._beforeUnloadListener);
    }
  },

  stopAutoSync() {
    if (typeof document !== 'undefined' && this._visibilityListener) {
      document.removeEventListener('visibilitychange', this._visibilityListener);
      this._visibilityListener = null;
    }
    if (typeof window !== 'undefined' && this._beforeUnloadListener) {
      window.removeEventListener('beforeunload', this._beforeUnloadListener);
      this._beforeUnloadListener = null;
    }
  },
};
