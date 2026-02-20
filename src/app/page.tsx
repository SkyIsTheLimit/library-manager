"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/database/dexie";
import { AddBookDialog } from "@/components/books/AddBookDialog";
import { PlaylistDialog } from "@/components/playlists/PlaylistDialog";
import { EditPlaylistDialog } from "@/components/playlists/EditPlaylistDialog";
import { BookCard } from "@/components/books/BookCard";
import { UpdateProgressDialog } from "@/components/books/UpdateProgressDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  Library,
  Plus,
  LayoutGrid,
  Loader2,
  Edit3,
  Play,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";

import { libraryService } from "@/lib/services/library";
import { useIsMobile } from "@/lib/hooks/use-mobile";

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null,
  );

  const books = useLiveQuery(() =>
    db.books
      .orderBy("dateAdded")
      .reverse()
      .filter((b) => !b.deleted)
      .toArray(),
  );
  const recentProgress = useLiveQuery(() =>
    db.progress.orderBy("lastAccessed").reverse().limit(3).toArray(),
  );
  const playlists = useLiveQuery(() =>
    db.playlists.filter((p) => !p.deleted).toArray(),
  );

  const activePlaylist = playlists?.find((p) => p.id === selectedPlaylistId);
  const filteredBooks =
    selectedPlaylistId && activePlaylist
      ? books?.filter((book) =>
          activePlaylist.bookIds.includes(book.externalId),
        )
      : books;

  const updateAccessTime = (externalId: string) => {
    libraryService.updateLastAccessed(externalId);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-muted/20 border-r w-64 shrink-0">
      <div className="p-6">
        <div className="mb-8">
          <AddBookDialog />
        </div>

        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">
          Library
        </h2>
        <nav className="space-y-1">
          <Button
            variant={!selectedPlaylistId ? "secondary" : "ghost"}
            className={`w-full justify-start gap-3 rounded-xl font-bold uppercase text-[11px] tracking-wider h-11 ${!selectedPlaylistId ? "bg-primary/10 text-primary border border-primary/10" : ""}`}
            onClick={() => setSelectedPlaylistId(null)}
          >
            <Library className="h-4 w-4" /> All Books
          </Button>
        </nav>

        <div className="mt-10 mb-4 flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
            Playlists
          </h2>
          <PlaylistDialog>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </PlaylistDialog>
        </div>
        <ScrollArea className="h-[calc(100vh-340px)] -mx-2 px-2">
          <div className="space-y-1">
            {playlists?.map((playlist) => (
              <Button
                key={playlist.id}
                variant={
                  selectedPlaylistId === playlist.id ? "secondary" : "ghost"
                }
                className={`w-full justify-start gap-3 rounded-xl font-bold uppercase text-[11px] tracking-wider h-11 truncate ${selectedPlaylistId === playlist.id ? "bg-primary/10 text-primary border border-primary/10" : ""}`}
                onClick={() => setSelectedPlaylistId(playlist.id)}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                <span className="truncate">{playlist.name}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden relative">
      {/* Desktop Sidebar */}
      {!isMobile && sidebarContent}

      <main className="flex-grow overflow-y-auto no-scrollbar">
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          {/* Mobile Playlist Title */}
          {isMobile && (
            <div className="mb-6">
              <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
                {activePlaylist ? activePlaylist.name : "My Library"}
              </h1>
              {activePlaylist?.description && (
                <p className="text-muted-foreground font-medium text-xs mt-1">
                  {activePlaylist.description}
                </p>
              )}
            </div>
          )}

          {/* Continue Reading Section */}
          {recentProgress && recentProgress.length > 0 && (
            <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-5 flex items-center gap-2 text-primary/60">
                <BookOpen className="h-4 w-4" /> Continue Reading
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
                {recentProgress.map((prog) => {
                  const book = books?.find((b) => b.externalId === prog.bookId);
                  if (!book) return null;
                  return (
                    <div key={prog.id} className="shrink-0 w-[260px]">
                      <Card className="overflow-hidden bg-card/40 backdrop-blur-sm border-primary/5 rounded-2xl shadow-xl shadow-black/5 hover:border-primary/20 transition-all duration-500">
                        <div className="flex px-3 py-2.5 gap-3 items-center">
                          <Link
                            href={`/reader/${book.externalId}`}
                            onClick={() => updateAccessTime(book.externalId)}
                            className="relative w-14 h-20 flex-shrink-0 shadow-md rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300"
                          >
                            {book.coverUrl ? (
                              <img
                                src={book.coverUrl}
                                alt={book.title}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full bg-secondary flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-muted-foreground opacity-20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-primary/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play className="h-5 w-5 text-white fill-white" />
                            </div>
                          </Link>

                          <div className="flex flex-col flex-grow min-w-0 self-stretch justify-between py-0.5">
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-start gap-1">
                                <h3 className="font-black text-[11px] line-clamp-1 leading-tight uppercase tracking-tight opacity-90 truncate flex-grow">
                                  {book.title}
                                </h3>
                                <UpdateProgressDialog
                                  bookId={book.externalId}
                                  initialChapter={prog.currentChapterTitle}
                                  initialPercent={prog.percentComplete}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 rounded-md -mr-1 opacity-50 hover:opacity-100 shrink-0"
                                  >
                                    <Edit3 className="h-2.5 w-2.5" />
                                  </Button>
                                </UpdateProgressDialog>
                              </div>
                              {prog.currentChapterTitle && (
                                <p className="text-[10px] text-primary font-black uppercase tracking-widest truncate opacity-70">
                                  {prog.currentChapterTitle}
                                </p>
                              )}
                            </div>

                            <div className="space-y-1 mt-auto">
                              <div className="flex justify-between items-end px-0.5">
                                <span className="text-[10px] font-black text-muted-foreground/60 tracking-tighter">
                                  {prog.percentComplete}%
                                </span>
                                <Link
                                  href={`/reader/${book.externalId}`}
                                  onClick={() =>
                                    updateAccessTime(book.externalId)
                                  }
                                  className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                                >
                                  Resume
                                </Link>
                              </div>
                              <div className="w-full bg-secondary/30 h-1 rounded-full overflow-hidden">
                                <div
                                  className="bg-primary h-full transition-all"
                                  style={{ width: `${prog.percentComplete}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* All Books Section */}
          <section className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
            <div className="flex flex-col gap-6 mb-8">
              {isMobile && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                  <PlaylistDialog>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9 rounded-full shrink-0 bg-secondary/50 border-none"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </PlaylistDialog>
                  <Button
                    variant={!selectedPlaylistId ? "default" : "secondary"}
                    size="sm"
                    className="rounded-full px-5 h-9 text-[11px] font-bold uppercase tracking-wider shrink-0"
                    onClick={() => setSelectedPlaylistId(null)}
                  >
                    All Books
                  </Button>
                  {playlists?.map((playlist) => (
                    <Button
                      key={playlist.id}
                      variant={
                        selectedPlaylistId === playlist.id
                          ? "default"
                          : "secondary"
                      }
                      size="sm"
                      className="rounded-full px-5 h-9 text-[11px] font-bold uppercase tracking-wider shrink-0"
                      onClick={() => setSelectedPlaylistId(playlist.id)}
                    >
                      {playlist.name}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                    {activePlaylist ? "Playlist Content" : "Library Grid"}
                  </h2>
                  {activePlaylist && !isMobile && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                      <EditPlaylistDialog playlist={activePlaylist} />
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                  {filteredBooks?.length || 0} ITEMS
                </p>
              </div>
            </div>

            {filteredBooks === undefined ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 animate-pulse">
                  Syncing Library...
                </p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed border-2 bg-transparent rounded-[3rem] border-muted/20">
                <div className="bg-secondary/30 p-6 rounded-full mb-6">
                  <Library className="h-10 w-10 text-muted-foreground opacity-20" />
                </div>
                <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">
                  {selectedPlaylistId ? "Empty Playlist" : "Empty Library"}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground/40 mt-2 mb-8 uppercase tracking-tighter">
                  {selectedPlaylistId
                    ? "Add books to this playlist from your library."
                    : "Add a book URL to get started."}
                </p>
                {!selectedPlaylistId && <AddBookDialog />}
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-12 pb-24 sm:pb-0">
                {filteredBooks.map((book) => {
                  const prog = recentProgress?.find(
                    (p) => p.bookId === book.externalId,
                  );
                  return <BookCard key={book.id} book={book} progress={prog} />;
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Mobile Floating Action Button (FAB) */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-50">
          <AddBookDialog>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 active:scale-95 transition-all"
            >
              <PlusCircle className="h-7 w-7 text-primary-foreground" />
            </Button>
          </AddBookDialog>
        </div>
      )}
    </div>
  );
}
