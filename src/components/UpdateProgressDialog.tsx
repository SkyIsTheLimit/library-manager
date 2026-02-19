'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Edit3 } from 'lucide-react';

export function UpdateProgressDialog({ 
  bookId, 
  initialChapter, 
  initialPercent 
}: { 
  bookId: string, 
  initialChapter?: string, 
  initialPercent?: number 
}) {
  const [open, setOpen] = useState(false);
  const [chapter, setChapter] = useState(initialChapter || '');
  const [percent, setPercent] = useState(initialPercent || 0);

  const handleUpdate = async () => {
    const existing = await db.progress.where('bookId').equals(bookId).first();
    if (existing) {
      await db.progress.update(existing.id!, {
        currentChapterTitle: chapter,
        percentComplete: Number(percent),
        lastAccessed: Date.now(),
      });
    } else {
      await db.progress.add({
        bookId,
        currentChapterUrl: '',
        currentChapterTitle: chapter,
        percentComplete: Number(percent),
        lastAccessed: Date.now(),
      });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <Edit3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Reading Progress</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Current Chapter</label>
            <Input
              placeholder="e.g. Chapter 1: Introduction"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Percentage Complete ({percent}%)</label>
            <Input
              type="range"
              min="0"
              max="100"
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
            />
          </div>
          <Button onClick={handleUpdate}>Save Progress</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
