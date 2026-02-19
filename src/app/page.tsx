"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { AddBookDialog } from "@/components/books/AddBookDialog";
import { AddToPlaylistDialog } from "@/components/playlists/AddToPlaylistDialog";
import { PlaylistDialog } from "@/components/playlists/PlaylistDialog";
import { EditPlaylistDialog } from "@/components/playlists/EditPlaylistDialog";
import { UpdateProgressDialog } from "@/components/books/UpdateProgressDialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  BookOpen,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { libraryService } from "@/lib/services/library";

export default function Dashboard() {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(
    null,
  );

  const books = useLiveQuery(() =>
    db.books.orderBy("dateAdded").reverse().toArray(),
  );
  const recentProgress = useLiveQuery(() =>
    db.progress.orderBy("lastAccessed").reverse().limit(3).toArray(),
  );
  const playlists = useLiveQuery(() => db.playlists.toArray());

  const activePlaylist = playlists?.find((p) => p.id === selectedPlaylistId);
  const filteredBooks =
    selectedPlaylistId && activePlaylist
      ? books?.filter((book) =>
          activePlaylist.bookIds.includes(book.externalId),
        )
      : books;

  const deleteBook = async (id: number, externalId: string) => {
    if (confirm("Are you sure you want to remove this book?")) {
      await libraryService.deleteBook(id, externalId);
    }
  };

  const updateAccessTime = (externalId: string) => {
    libraryService.updateLastAccessed(externalId);
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

      {/* All Books Section */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold whitespace-nowrap">
              {activePlaylist ? `Playlist: ${activePlaylist.name}` : "All Books"}
            </h2>
            
            <div className="flex items-center gap-2">
              <select
                className="flex h-8 w-fit rounded-md bg-secondary/50 px-3 py-1 text-xs font-bold uppercase tracking-tight text-foreground border-none hover:bg-secondary/80 transition-colors focus-visible:outline-none cursor-pointer appearance-none min-w-[120px]"
                value={selectedPlaylistId || ""}
                onChange={(e) => setSelectedPlaylistId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Filter by Playlist</option>
                {playlists?.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name} ({playlist.bookIds.length})
                  </option>
                ))}
              </select>
              
              {activePlaylist && (
                <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-300">
                  <EditPlaylistDialog playlist={activePlaylist} />
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary px-2"
                    onClick={() => setSelectedPlaylistId(null)}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            {filteredBooks?.length || 0} {selectedPlaylistId ? "Filtered" : "Total"} Books
          </p>
        </div>
        {filteredBooks === undefined ? (
          <div className="flex justify-center py-12">
            <p className="text-muted-foreground animate-pulse">
              Loading library...
            </p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed border-2 bg-transparent">
            <div className="bg-secondary p-4 rounded-full mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground opacity-40" />
            </div>
            <p className="text-muted-foreground font-medium">
              {selectedPlaylistId
                ? "This playlist is empty."
                : "Your library is empty."}
            </p>
            <p className="text-xs text-muted-foreground/60 mb-6">
              {selectedPlaylistId
                ? "Add books to this playlist from the library below."
                : "Add a book URL to get started."}
            </p>
            {!selectedPlaylistId && <AddBookDialog />}
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
            {filteredBooks.map((book) => {
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
