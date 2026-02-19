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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, List } from "lucide-react";
import { AdapterFormDialog } from "./CreateAdapterDialog";
import { syncService } from "@/lib/sync";

export function ManageAdaptersDialog() {
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Adapters</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] mt-4 pr-4">
          <div className="flex flex-col gap-2">
            {adapters.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground italic">
                No custom adapters found.
              </p>
            ) : (
              adapters.map((adapter) => (
                <div
                  key={adapter.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/50 group hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="text-sm font-bold truncate leading-tight">
                      {adapter.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono truncate opacity-60">
                      {adapter.urlMatchPattern}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AdapterFormDialog adapter={adapter} />
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(adapter.id as any)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
