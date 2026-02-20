"use client";

import { useLiveQuery } from "dexie-react-hooks";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, List } from "lucide-react";
import { AdapterFormDialog } from "./CreateAdapterDialog";
import { syncService } from "@/lib/sync";
import { useIsMobile } from "@/lib/hooks/use-mobile";

export function ManageAdaptersDialog() {
  const isMobile = useIsMobile();
  const adapters = useLiveQuery(() => db.adapters.filter(a => !a.deleted).toArray()) || [];

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this adapter? This will not remove books using it, but they may no longer open correctly.",
      )
    ) {
      await db.adapters.update(id, {
        deleted: true,
        updatedAt: Date.now()
      });
      syncService.triggerSync();
    }
  };

  const content = (
    <div className="flex flex-col gap-2 p-4 sm:p-0">
      <ScrollArea className="h-[300px] mt-2 pr-4 -mr-4">
        <div className="flex flex-col gap-2 pr-4">
          {adapters.length === 0 ? (
            <p className="text-center py-12 text-[11px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">
              No custom adapters found.
            </p>
          ) : (
            adapters.map((adapter) => (
              <div
                key={adapter.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-secondary/20 border border-border/50 group hover:border-primary/20 transition-all duration-500"
              >
                <div className="flex flex-col gap-1 overflow-hidden">
                  <span className="text-[11px] font-black uppercase tracking-tight truncate leading-tight">
                    {adapter.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono truncate opacity-60 uppercase tracking-tighter">
                    {adapter.urlMatchPattern}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <AdapterFormDialog adapter={adapter} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                    onClick={() => handleDelete(adapter.id as any)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full transition-all"
    >
      <List className="h-4 w-4" />
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          {trigger}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl font-black uppercase tracking-tight">Manage Adapters</DrawerTitle>
          </DrawerHeader>
          {content}
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="ghost" className="h-12 rounded-xl font-bold uppercase text-[11px] tracking-widest">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">Manage Adapters</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
