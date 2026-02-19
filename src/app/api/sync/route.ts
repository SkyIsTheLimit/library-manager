import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/database/d1";
import { books, progress, playlists, playlistBooks, adapters } from "@/lib/database/schema";
import { eq, gt, and, inArray, or, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
    const { env } = await getCloudflareContext();
    const session = await auth(env.DB).api.getSession({
        headers: req.headers
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const db = getDb(env.DB);

    const clientChanges = body as {
        books: any[];
        progress: any[];
        playlists: any[];
        adapters: any[];
        lastSyncTime: number;
    };

    // 1. Process Client Changes (Atomic Upsert with Last Writer Wins)
    if (clientChanges.books && clientChanges.books.length > 0) {
        for (const book of clientChanges.books) {
            await db.insert(books).values({
                ...book,
                userId,
                dateAdded: new Date(book.dateAdded),
                updatedAt: new Date(book.updatedAt),
            }).onConflictDoUpdate({
                target: books.id,
                set: {
                    externalId: book.externalId,
                    source: book.source,
                    slug: book.slug,
                    title: book.title,
                    author: book.author,
                    coverUrl: book.coverUrl,
                    readerUrl: book.readerUrl,
                    dateAdded: new Date(book.dateAdded),
                    updatedAt: new Date(book.updatedAt),
                    deleted: book.deleted,
                },
                where: sql`${books.updatedAt} < ${new Date(book.updatedAt).getTime()}`
            });
        }
    }

    if (clientChanges.progress && clientChanges.progress.length > 0) {
        for (const p of clientChanges.progress) {
            await db.insert(progress).values({
                ...p,
                userId,
                lastAccessed: new Date(p.lastAccessed),
                updatedAt: new Date(p.updatedAt),
            }).onConflictDoUpdate({
                target: progress.id,
                set: {
                    currentChapterUrl: p.currentChapterUrl,
                    currentChapterTitle: p.currentChapterTitle,
                    percentComplete: p.percentComplete,
                    lastAccessed: new Date(p.lastAccessed),
                    updatedAt: new Date(p.updatedAt),
                },
                where: sql`${progress.updatedAt} < ${new Date(p.updatedAt).getTime()}`
            });
        }
    }

    if (clientChanges.playlists && clientChanges.playlists.length > 0) {
        for (const pl of clientChanges.playlists) {
            const { bookIds, ...playlistData } = pl;
            await db.insert(playlists).values({
                ...playlistData,
                userId,
                updatedAt: new Date(playlistData.updatedAt),
            }).onConflictDoUpdate({
                target: playlists.id,
                set: {
                    name: playlistData.name,
                    description: playlistData.description,
                    updatedAt: new Date(playlistData.updatedAt),
                    deleted: playlistData.deleted,
                },
                where: sql`${playlists.updatedAt} < ${new Date(playlistData.updatedAt).getTime()}`
            });

            if (bookIds) {
                await db.delete(playlistBooks).where(eq(playlistBooks.playlistId, pl.id));
                for (const bookId of bookIds) {
                    await db.insert(playlistBooks).values({
                        playlistId: pl.id,
                        bookId
                    });
                }
            }
        }
    }

    if (clientChanges.adapters && clientChanges.adapters.length > 0) {
        for (const adapter of clientChanges.adapters) {
            await db.insert(adapters).values({
                ...adapter,
                userId,
                updatedAt: new Date(adapter.updatedAt),
            }).onConflictDoUpdate({
                target: adapters.id,
                set: {
                    name: adapter.name,
                    urlMatchPattern: adapter.urlMatchPattern,
                    titleSelector: adapter.titleSelector,
                    authorSelector: adapter.authorSelector,
                    coverSelector: adapter.coverSelector,
                    readerUrlTemplate: adapter.readerUrlTemplate,
                    idRegex: adapter.idRegex,
                    slugRegex: adapter.slugRegex,
                    updatedAt: new Date(adapter.updatedAt),
                    deleted: adapter.deleted,
                },
                where: sql`${adapters.updatedAt} < ${new Date(adapter.updatedAt).getTime()}`
            });
        }
    }

    const lastSyncDate = new Date(clientChanges.lastSyncTime);
    const serverSyncTime = Date.now();
    console.log(`Sync request from user ${userId}. Client last sync: ${lastSyncDate.toISOString()}`);

    const serverBooks = await db.select().from(books).where(
        clientChanges.lastSyncTime === 0 
            ? eq(books.userId, userId)
            : and(eq(books.userId, userId), gt(books.updatedAt, lastSyncDate))
    );

    const serverProgress = await db.select().from(progress).where(
        clientChanges.lastSyncTime === 0
            ? eq(progress.userId, userId)
            : and(eq(progress.userId, userId), gt(progress.updatedAt, lastSyncDate))
    );

    const serverPlaylists = await db.select().from(playlists).where(
        clientChanges.lastSyncTime === 0
            ? eq(playlists.userId, userId)
            : and(eq(playlists.userId, userId), gt(playlists.updatedAt, lastSyncDate))
    );

    const serverAdapters = await db.select().from(adapters).where(
        clientChanges.lastSyncTime === 0
            ? eq(adapters.userId, userId)
            : and(eq(adapters.userId, userId), gt(adapters.updatedAt, lastSyncDate))
    );

    console.log(`Found server changes: ${serverBooks.length} books, ${serverProgress.length} progress, ${serverPlaylists.length} playlists, ${serverAdapters.length} adapters`);

    const playlistIds = serverPlaylists.map(p => p.id);
    const serverPlaylistBooks = playlistIds.length > 0 
        ? await db.select().from(playlistBooks).where(inArray(playlistBooks.playlistId, playlistIds))
        : [];

    const formattedPlaylists = serverPlaylists.map(p => ({
        ...p,
        bookIds: serverPlaylistBooks.filter(pb => pb.playlistId === p.id).map(pb => pb.bookId),
        updatedAt: p.updatedAt.getTime()
    }));

    return NextResponse.json({
        books: serverBooks.map(b => ({ ...b, dateAdded: b.dateAdded.getTime(), updatedAt: b.updatedAt.getTime() })),
        progress: serverProgress.map(p => ({ ...p, lastAccessed: p.lastAccessed.getTime(), updatedAt: p.updatedAt.getTime() })),
        playlists: formattedPlaylists,
        adapters: serverAdapters.map(a => ({ ...a, updatedAt: a.updatedAt.getTime() })),
        syncTime: serverSyncTime
    });
}
