"use client";

import { useState } from "react";
import { db } from "@/lib/database/dexie";
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
import { Plus } from "lucide-react";
import { syncService } from "@/lib/sync";
import { useIsMobile } from "@/lib/hooks/use-mobile";

export function PlaylistDialog({ children }: { children?: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreatePlaylist = async () => {
    if (!name) return;

    await db.playlists.add({
      id: crypto.randomUUID(),
      name,
      description,
      bookIds: [],
      updatedAt: Date.now(),
    });

    syncService.triggerSync();
    setOpen(false);
    setName("");
    setDescription("");
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
      <Button 
        size="lg"
        onClick={handleCreatePlaylist}
        className="h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20"
      >
        Create Playlist
      </Button>
    </div>
  );

  const trigger = children || (
    <Button variant="outline" className="h-9 px-4 rounded-full font-bold uppercase text-[11px] tracking-wider gap-2">
      <Plus className="h-4 w-4" /> New Playlist
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
            <DrawerTitle className="text-xl font-black uppercase tracking-tight">Create New Playlist</DrawerTitle>
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
          <DialogTitle className="text-xl font-black uppercase tracking-tight">Create New Playlist</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
