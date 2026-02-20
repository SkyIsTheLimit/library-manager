"use client";

import { useState } from "react";
import { db } from "@/lib/database/dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { libraryService } from "@/lib/services/library";
import { getAdapterById, getAdapterForUrl } from "@/lib/adapters";
import { AdapterFormDialog } from "@/components/adapters/CreateAdapterDialog";
import { ManageAdaptersDialog } from "@/components/adapters/ManageAdaptersDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { syncService } from "@/lib/sync";
import { useIsMobile } from "@/lib/hooks/use-mobile";

export function AddBookDialog({ children }: { children?: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedAdapterId, setSelectedAdapterId] = useState<string>("");
  const [isManualSelection, setIsManualSelection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const adapters = useLiveQuery(() => db.adapters.toArray()) || [];

  const handleUrlChange = async (newUrl: string) => {
    setUrl(newUrl);

    if (!isManualSelection) {
      const detectedAdapter = await getAdapterForUrl(newUrl);
      if (detectedAdapter) {
        setSelectedAdapterId(detectedAdapter.id);
      } else {
        setSelectedAdapterId("");
      }
    }
  };

  const handleAdapterChange = async (adapterId: string) => {
    setSelectedAdapterId(adapterId);
    if (adapterId === "") {
      setIsManualSelection(false);
      // Immediately try to detect based on current URL
      const detectedAdapter = await getAdapterForUrl(url);
      if (detectedAdapter) {
        setSelectedAdapterId(detectedAdapter.id);
      }
    } else {
      setIsManualSelection(true);
    }
  };

  const handleAddBook = async () => {
    if (!url) return;
    setLoading(true);
    setError("");

    try {
      const metadata = await libraryService.fetchBookMetadata(url, selectedAdapterId);
      if (!metadata || !metadata.externalId) {
        throw new Error(
          "Could not extract book information. Please check the URL and selected adapter.",
        );
      }

      // Check if book already exists
      const existing = await db.books
        .where("externalId")
        .equals(metadata.externalId)
        .first();
      if (existing) {
        throw new Error("This book is already in your library.");
      }

      const adapter = await getAdapterById(metadata.source);
      if (!adapter) {
        throw new Error("No adapter found for this source.");
      }

      const readerUrl = adapter.generateReaderUrl(
        metadata.externalId,
        metadata.slug,
      );

      await db.books.add({
        id: crypto.randomUUID(),
        externalId: metadata.externalId,
        source: metadata.source,
        slug: metadata.slug,
        title: metadata.title,
        author: metadata.author,
        coverUrl: metadata.coverUrl,
        readerUrl: readerUrl,
        dateAdded: Date.now(),
        updatedAt: Date.now(),
      });

      syncService.triggerSync();
      setOpen(false);
      setUrl("");
      setSelectedAdapterId("");
      setIsManualSelection(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="grid gap-4 py-4 px-4 sm:px-0">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Book URL</label>
          <Input
            placeholder="Paste Book URL"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddBook()}
            autoFocus
            className="h-12 rounded-xl bg-secondary/50 border-none focus-visible:ring-primary/20"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              Source:
            </label>
            <select
              className="flex h-8 w-fit rounded-md bg-secondary/50 px-3 py-1 text-[10px] font-black uppercase tracking-tight text-foreground border-none hover:bg-secondary/80 transition-colors focus-visible:outline-none cursor-pointer appearance-none"
              value={selectedAdapterId}
              onChange={(e) => handleAdapterChange(e.target.value)}
            >
              <option value="" className="bg-background text-foreground">
                Auto-Detect
              </option>
              {adapters.map((adapter) => (
                <option
                  key={adapter.id}
                  value={adapter.id}
                  className="bg-background text-foreground"
                >
                  {adapter.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <ManageAdaptersDialog />
            <AdapterFormDialog />
          </div>
        </div>
      </div>
      {error && <p className="text-sm font-bold text-destructive px-1">{error}</p>}
      <Button
        size="lg"
        onClick={handleAddBook}
        disabled={loading || (selectedAdapterId === "" && !url)}
        className="h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Fetching Metadata...
          </>
        ) : (
          "Add to Library"
        )}
      </Button>
    </div>
  );

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setUrl("");
      setSelectedAdapterId("");
      setIsManualSelection(false);
      setError("");
    }
  };

  const trigger = children || (
    <Button variant="outline" className="h-9 px-4 rounded-full font-bold uppercase text-[11px] tracking-wider gap-2">
      <Plus className="h-4 w-4" /> Add Book
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          {trigger}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl font-black uppercase tracking-tight">Add New Book</DrawerTitle>
          </DrawerHeader>
          {formContent}
          <DrawerFooter className="pt-0">
            <DrawerClose asChild>
              <Button variant="ghost" className="h-12 rounded-xl font-bold uppercase text-[11px] tracking-widest">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">Add New Book</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
