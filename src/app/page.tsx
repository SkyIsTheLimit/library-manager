"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { AddBookDialog } from "@/components/AddBookDialog";
import { AddToPlaylistDialog } from "@/components/AddToPlaylistDialog";
import { PlaylistDialog } from "@/components/PlaylistDialog";
import { UpdateProgressDialog } from "@/components/UpdateProgressDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  BookOpen,
  Trash2,
  List,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const books = useLiveQuery(() =>
    db.books.orderBy("dateAdded").reverse().toArray(),
  );
  const recentProgress = useLiveQuery(() =>
    db.progress.orderBy("lastAccessed").reverse().limit(3).toArray(),
  );
  const playlists = useLiveQuery(() => db.playlists.toArray());

  const deleteBook = async (id: number, externalId: string) => {
    if (confirm("Are you sure you want to remove this book?")) {
      await db.books.delete(id);
      await db.progress.where("bookId").equals(externalId).delete();
      if (playlists) {
        for (const playlist of playlists) {
          if (playlist.bookIds.includes(externalId)) {
            await db.playlists.update(playlist.id!, {
              bookIds: playlist.bookIds.filter((id) => id !== externalId),
            });
          }
        }
      }
    }
  };

  const deletePlaylist = async (id: number) => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      await db.playlists.delete(id);
    }
  };

  const updateAccessTime = async (externalId: string) => {
    const existing = await db.progress
      .where("bookId")
      .equals(externalId)
      .first();
    if (existing) {
      await db.progress.update(existing.id!, { lastAccessed: Date.now() });
    } else {
      await db.progress.add({
        bookId: externalId,
        currentChapterUrl: "",
        currentChapterTitle: "",
        percentComplete: 0,
        lastAccessed: Date.now(),
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Library
          </h1>
          <p className="text-muted-foreground">
            Keep track of all your books in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <PlaylistDialog />
          <AddBookDialog />
        </div>
      </header>

      {/* Continue Reading Section */}
      {recentProgress && recentProgress.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Continue Reading
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentProgress.map((prog) => {
              const book = books?.find((b) => b.externalId === prog.bookId);
              if (!book) return null;
              return (
                <Card
                  key={prog.id}
                  className="overflow-hidden bg-card/50 backdrop-blur border-primary/10"
                >
                  <div className="flex p-4 gap-4">
                    <div className="relative w-16 h-24 flex-shrink-0">
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="object-cover w-full h-full rounded shadow-sm"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center rounded">
                          <BookOpen className="h-8 w-8 text-muted-foreground opacity-20" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-between overflow-hidden flex-grow">
                      <div className="overflow-hidden">
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                            {book.title}
                          </h3>
                          <UpdateProgressDialog
                            bookId={book.externalId}
                            initialChapter={prog.currentChapterTitle}
                            initialPercent={prog.percentComplete}
                          />
                        </div>
                        {prog.currentChapterTitle && (
                          <p className="text-[10px] text-primary font-medium mt-1 truncate">
                            {prog.currentChapterTitle}
                          </p>
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-muted-foreground">
                            {prog.percentComplete}% complete
                          </span>
                        </div>
                        <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all"
                            style={{ width: `${prog.percentComplete}%` }}
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full mt-3 h-7 text-[10px] font-bold uppercase tracking-wider"
                          asChild
                          onClick={() => updateAccessTime(book.externalId)}
                        >
                          <Link href={`/reader/${book.externalId}`}>
                            Resume Reading
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Playlists Section */}
      {playlists && playlists.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <List className="h-5 w-5" /> Playlists
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
            {playlists.map((playlist) => (
              <Card
                key={playlist.id}
                className="flex-shrink-0 w-[240px] group relative bg-secondary/30 border-none"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-semibold">
                      {playlist.name}
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deletePlaylist(playlist.id!)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {playlist.description}
                  </p>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />{" "}
                    {playlist.bookIds.length} Books
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* All Books Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">All Books</h2>
          <p className="text-xs text-muted-foreground">
            {books?.length || 0} books in library
          </p>
        </div>
        {books === undefined ? (
          <div className="flex justify-center py-12">
            <p className="text-muted-foreground animate-pulse">
              Loading library...
            </p>
          </div>
        ) : books.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed border-2 bg-transparent">
            <div className="bg-secondary p-4 rounded-full mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground opacity-40" />
            </div>
            <p className="text-muted-foreground font-medium">
              Your library is empty.
            </p>
            <p className="text-xs text-muted-foreground/60 mb-6">
              Add a book URL to get started.
            </p>
            <AddBookDialog />
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
            {books.map((book) => {
              const prog = recentProgress?.find(
                (p) => p.bookId === book.externalId,
              );
              return (
                <div key={book.id} className="flex flex-col group">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-md group-hover:shadow-2xl transition-all duration-500">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-muted-foreground opacity-10" />
                      </div>
                    )}

                    {/* Progress overlay at bottom */}
                    {prog && prog.percentComplete > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                        <div
                          className="h-full bg-primary transition-all shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                          style={{ width: `${prog.percentComplete}%` }}
                        />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="font-bold shadow-lg h-9 px-6 rounded-full"
                        asChild
                        onClick={() => updateAccessTime(book.externalId)}
                      >
                        <Link href={`/reader/${book.externalId}`}>
                          <ExternalLink className="h-4 w-4 mr-2" /> Read Now
                        </Link>
                      </Button>
                      <div className="flex gap-3">
                        <AddToPlaylistDialog externalId={book.externalId} />
                        <UpdateProgressDialog
                          bookId={book.externalId}
                          initialChapter={prog?.currentChapterTitle}
                          initialPercent={prog?.percentComplete}
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0 rounded-full"
                          onClick={() => deleteBook(book.id!, book.externalId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 px-1">
                    <h3 className="text-sm font-bold leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors duration-300">
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-medium truncate italic">
                      {book.author}
                    </p>
                    {prog?.percentComplete ? (
                      <p className="text-[10px] text-primary/80 font-bold mt-1 uppercase tracking-tighter">
                        {prog.percentComplete}% Read
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
