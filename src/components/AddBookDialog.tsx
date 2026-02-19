"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { fetchBookMetadata } from "@/lib/actions";
import { getAdapterById, getAdapterForUrl } from "@/lib/adapters";
import { AdapterFormDialog } from "@/components/CreateAdapterDialog";
import { ManageAdaptersDialog } from "@/components/ManageAdaptersDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";

export function AddBookDialog() {
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
      const metadata = await fetchBookMetadata(url, selectedAdapterId);
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
        externalId: metadata.externalId,
        source: metadata.source,
        slug: metadata.slug,
        title: metadata.title,
        author: metadata.author,
        coverUrl: metadata.coverUrl,
        readerUrl: readerUrl,
        dateAdded: Date.now(),
      });

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

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setUrl("");
          setSelectedAdapterId("");
          setIsManualSelection(false);
          setError("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" /> Add Book
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Book</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Book URL</label>
              <Input
                placeholder="Paste Book URL"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddBook()}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Source:
                </label>
                <select
                  className="flex h-7 w-fit rounded-md bg-background px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-foreground border border-input hover:bg-accent transition-colors focus-visible:outline-none cursor-pointer"
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            onClick={handleAddBook}
            disabled={loading || (selectedAdapterId === "" && !url)}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Metadata...
              </>
            ) : (
              "Add to Library"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
