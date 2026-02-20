"use client";

import { Book, Progress } from "@/lib/database/dexie";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  ExternalLink,
  BookOpen,
  Trash2,
  Plus,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { AddToPlaylistDialog } from "@/components/playlists/AddToPlaylistDialog";
import { UpdateProgressDialog } from "@/components/books/UpdateProgressDialog";
import { libraryService } from "@/lib/services/library";

interface BookCardProps {
  book: Book;
  progress?: Progress;
}

export function BookCard({ book, progress }: BookCardProps) {
  const deleteBook = async () => {
    if (confirm("Are you sure you want to remove this book?")) {
      await libraryService.deleteBook(book.id!, book.externalId);
    }
  };

  const updateAccessTime = () => {
    libraryService.updateLastAccessed(book.externalId);
  };

  return (
    <div className="flex flex-col group">
      <Drawer>
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-md active:scale-95 transition-all duration-300">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-muted-foreground opacity-10" />
            </div>
          )}

          {/* Progress overlay at bottom */}
          {progress && progress.percentComplete > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
              <div
                className="h-full bg-primary transition-all shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                style={{ width: `${progress.percentComplete}%` }}
              />
            </div>
          )}

          {/* Mobile-First Trigger: The whole card or a button */}
          <DrawerTrigger asChild>
            <button className="absolute inset-0 w-full h-full cursor-pointer appearance-none bg-transparent">
              <span className="sr-only">Open book actions</span>
            </button>
          </DrawerTrigger>
        </div>

        <div className="mt-3 px-1">
          <h3 className="text-sm font-bold leading-tight line-clamp-2 mb-0.5 group-hover:text-primary transition-colors duration-300">
            {book.title}
          </h3>
          <p className="text-[11px] text-muted-foreground font-medium truncate italic">
            {book.author}
          </p>
          {progress?.percentComplete ? (
            <p className="text-[10px] text-primary/80 font-bold mt-1 uppercase tracking-tighter">
              {progress.percentComplete}% Read
            </p>
          ) : null}
        </div>

        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader className="text-left pb-2">
              <div className="flex gap-4 items-start">
                <div className="w-16 h-24 shrink-0 rounded-lg overflow-hidden shadow-md">
                   {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <BookOpen className="h-6 w-6 opacity-20" />
                    </div>
                  )}
                </div>
                <div>
                  <DrawerTitle className="text-base font-black leading-tight line-clamp-2">{book.title}</DrawerTitle>
                  <DrawerDescription className="text-xs font-semibold mt-1">{book.author}</DrawerDescription>
                  {progress && (
                    <div className="mt-2 flex items-center gap-2">
                       <div className="flex-grow bg-secondary h-1 rounded-full overflow-hidden w-24">
                        <div className="bg-primary h-full" style={{ width: `${progress.percentComplete}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-primary">{progress.percentComplete}%</span>
                    </div>
                  )}
                </div>
              </div>
            </DrawerHeader>
            
            <div className="p-4 grid grid-cols-1 gap-3">
              <Button
                size="lg"
                className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest gap-3 shadow-lg shadow-primary/20"
                asChild
                onClick={updateAccessTime}
              >
                <Link href={`/reader/${book.externalId}`}>
                  <ExternalLink className="h-5 w-5" /> Read Now
                </Link>
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <AddToPlaylistDialog externalId={book.externalId}>
                  <Button variant="secondary" className="h-12 rounded-xl font-bold uppercase text-[11px] tracking-wider gap-2">
                    <Plus className="h-4 w-4" /> Playlist
                  </Button>
                </AddToPlaylistDialog>

                <UpdateProgressDialog
                  bookId={book.externalId}
                  initialChapter={progress?.currentChapterTitle}
                  initialPercent={progress?.percentComplete}
                >
                  <Button variant="secondary" className="h-12 rounded-xl font-bold uppercase text-[11px] tracking-wider gap-2">
                    <BarChart3 className="h-4 w-4" /> Progress
                  </Button>
                </UpdateProgressDialog>
              </div>

              <Button
                variant="ghost"
                className="w-full h-12 rounded-xl text-destructive font-bold uppercase text-[11px] tracking-wider gap-2 hover:bg-destructive/5"
                onClick={deleteBook}
              >
                <Trash2 className="h-4 w-4" /> Remove from Library
              </Button>
            </div>
            
            <DrawerFooter className="pt-0">
              <DrawerClose asChild>
                <Button variant="outline" className="h-12 rounded-xl font-bold uppercase text-[11px] tracking-widest">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
