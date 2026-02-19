"use client";

import { useState } from "react";
import { db, Playlist } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Settings2, Trash2 } from "lucide-react";

export function EditPlaylistDialog({ playlist }: { playlist: Playlist }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description);

  const handleUpdate = async () => {
    if (!name) return;
    await db.playlists.update(playlist.id!, {
      name,
      description,
    });
    setOpen(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      await db.playlists.delete(playlist.id!);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="xs" 
          className="h-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground px-2 gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Settings2 className="h-3 w-3" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Playlist</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="e.g. React Mastery"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Input
              placeholder="Books about React and Next.js"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDelete}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> Delete Playlist
          </Button>
          <Button onClick={handleUpdate}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
