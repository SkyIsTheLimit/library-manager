'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database/dexie';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ListPlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

import { libraryService } from '@/lib/services/library';

export function AddToPlaylistDialog({ 
  externalId,
  children
}: { 
  externalId: string,
  children?: React.ReactNode
}) {
  const playlists = useLiveQuery(() => db.playlists.filter(p => !p.deleted).toArray());

  const handleToggle = async (playlistId: string) => {
    await libraryService.toggleBookInPlaylist(playlistId, externalId);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <ListPlus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4">
          <div className="flex flex-col gap-2">
            {playlists?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No playlists created yet.
              </p>
            )}
            {playlists?.map((playlist) => {
              const isActive = playlist.bookIds.includes(externalId);
              return (
                <Button
                  key={playlist.id}
                  variant={isActive ? "secondary" : "outline"}
                  className="justify-between"
                  onClick={() => handleToggle(playlist.id!)}
                >
                  {playlist.name}
                  {isActive && <span className="text-xs font-bold text-primary">Added</span>}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
