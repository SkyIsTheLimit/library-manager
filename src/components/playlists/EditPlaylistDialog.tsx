"use client";

import { useState } from "react";
import { db, Playlist } from "@/lib/database/dexie";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Settings2, Trash2 } from "lucide-react";

import { libraryService } from "@/lib/services/library";
import { useIsMobile } from "@/lib/hooks/use-mobile";

export function EditPlaylistDialog({ playlist }: { playlist: Playlist }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description);

  const handleUpdate = async () => {
    if (!name) return;
    await libraryService.updatePlaylist(playlist.id!, {
      name,
      description,
    });
    setOpen(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      await libraryService.deletePlaylist(playlist.id!);
      setOpen(false);
    }
  };

  const formContent = (
    <div className="grid gap-6 py-4 px-4 sm:px-0">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Name</label>
          <Input
            placeholder="e.g. React Mastery"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl bg-secondary/50 border-none focus-visible:ring-primary/20"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
            Description (Optional)
          </label>
          <Input
            placeholder="Books about React and Next.js"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-12 rounded-xl bg-secondary/50 border-none focus-visible:ring-primary/20"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Button 
          size="lg"
          onClick={handleUpdate}
          className="h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20 w-full"
        >
          Save Changes
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDelete}
          className="h-10 rounded-xl text-destructive font-bold uppercase text-[11px] tracking-widest hover:bg-destructive/5"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete Playlist
        </Button>
      </div>
    </div>
  );

  const trigger = (
    <Button 
      variant="ghost" 
      size="xs" 
      className="h-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground px-2 gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <Settings2 className="h-3 w-3" /> Edit
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {trigger}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl font-black uppercase tracking-tight">Edit Playlist</DrawerTitle>
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">Edit Playlist</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
