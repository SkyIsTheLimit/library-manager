"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Home,
  BookOpen,
  ExternalLink,
  Save,
  Clock,
  CheckCircle2,
  Layout,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function UniversalController() {
  const { id } = useParams();
  const router = useRouter();
  const books = useLiveQuery(() => db.books.toArray());
  const activeBook = books?.find((b) => b.externalId === id);
  const progress = useLiveQuery(() =>
    db.progress
      .where("bookId")
      .equals(id as string)
      .first(),
  );

  const [chapter, setChapter] = useState("");
  const [chapterUrl, setChapterUrl] = useState("");
  const [percent, setPercent] = useState(0);
  const [sessionStart] = useState(Date.now());
  const [elapsed, setElapsed] = useState("0m");
  const [hasSynced, setHasSynced] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-hide sidebar if screen is narrow (like iPad Split View)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (progress) {
      setChapter(progress.currentChapterTitle || "");
      setChapterUrl(progress.currentChapterUrl || "");
      setPercent(progress.percentComplete || 0);
    }
  }, [progress]);

  useEffect(() => {
    const timer = setInterval(() => {
      const mins = Math.floor((Date.now() - sessionStart) / 60000);
      setElapsed(`${mins}m`);
    }, 60000);
    return () => clearInterval(timer);
  }, [sessionStart]);

  const handleSync = async () => {
    if (!activeBook) return;
    const existing = await db.progress
      .where("bookId")
      .equals(activeBook.externalId)
      .first();
    if (existing) {
      await db.progress.update(existing.id!, {
        currentChapterTitle: chapter,
        currentChapterUrl: chapterUrl,
        percentComplete: Number(percent),
        lastAccessed: Date.now(),
      });
    } else {
      await db.progress.add({
        bookId: activeBook.externalId,
        currentChapterUrl: chapterUrl,
        currentChapterTitle: chapter,
        percentComplete: Number(percent),
        lastAccessed: Date.now(),
      });
    }
    setHasSynced(true);
    setTimeout(() => setHasSynced(false), 2000);
  };

  const openBook = () => {
    if (activeBook) {
      // Prioritize the deep-linked chapter URL if it exists
      const targetUrl = chapterUrl || activeBook.readerUrl;
      window.open(targetUrl, "_blank");
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-background">
      {/* Sidebar - Collapsible */}
      <aside
        className={`transition-all duration-300 border-r bg-muted/20 flex flex-col shrink-0 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden border-none"}`}
      >
        <div className="p-4 border-b flex justify-between items-center whitespace-nowrap">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> My Library
          </h2>
        </div>
        <ScrollArea className="flex-grow">
          <div className="p-3 space-y-1 min-w-[256px]">
            {books?.map((book) => (
              <Button
                key={book.id}
                variant={id === book.externalId ? "secondary" : "ghost"}
                className="w-full justify-start text-xs h-auto py-3 px-4 text-left rounded-lg"
                asChild
              >
                <Link href={`/reader/${book.externalId}`}>
                  <span className="line-clamp-2">{book.title}</span>
                </Link>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Controller Main */}
      <main className="flex-grow relative flex flex-col items-center p-4 md:p-8 overflow-y-auto bg-secondary/5">
        {/* Adaptive Header */}
        <div className="w-full max-w-xl flex justify-between items-center mb-8 gap-4">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-full"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-full hidden sm:flex"
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" /> Home
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 shadow-sm">
            <Clock className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {elapsed} Session
            </span>
          </div>
        </div>

        {activeBook ? (
          <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4 px-4">
              <div className="relative w-36 h-52 mx-auto shadow-2xl rounded-2xl overflow-hidden border-4 border-background transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                {activeBook.coverUrl ? (
                  <img
                    src={activeBook.coverUrl}
                    alt={activeBook.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <BookOpen className="h-12 w-12 opacity-20" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-black tracking-tight leading-tight line-clamp-2">
                  {activeBook.title}
                </h1>
                <p className="text-sm text-muted-foreground font-semibold italic">
                  {activeBook.author}
                </p>
              </div>
            </div>

            <Card className="border-none shadow-2xl bg-card/90 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Button
                    onClick={openBook}
                    className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-widest gap-3 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center"
                  >
                    <ExternalLink className="h-6 w-6" />{" "}
                    {chapterUrl ? "Resume Chapter" : "Open Book"}
                  </Button>
                  {chapterUrl && (
                    <p className="text-[10px] text-center text-muted-foreground font-bold tracking-wider animate-in fade-in">
                      RESUMING FROM SAVED DEEP LINK
                    </p>
                  )}
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-muted"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em]">
                    Session Sync
                  </span>
                  <div className="flex-grow border-t border-muted"></div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                      Current Chapter
                    </label>
                    <Input
                      placeholder="e.g. Chapter 4: High Availability"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      className="h-14 rounded-2xl bg-secondary/30 border-none text-base px-6 focus-visible:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-2">
                      <LinkIcon className="h-3 w-3" /> Chapter URL (Optional)
                    </label>
                    <Input
                      placeholder="Paste current reader URL to resume here later"
                      value={chapterUrl}
                      onChange={(e) => setChapterUrl(e.target.value)}
                      className="h-14 rounded-2xl bg-secondary/30 border-none text-xs px-6 focus-visible:ring-primary/20 font-mono"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end px-1">
                      <label className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">
                        Book Completion
                      </label>
                      <span className="text-xl font-black text-primary">
                        {percent}%
                      </span>
                    </div>
                    <div className="px-1">
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={percent}
                        onChange={(e) => setPercent(Number(e.target.value))}
                        className="w-full h-2 accent-primary cursor-pointer"
                      />
                    </div>
                  </div>

                  <Button
                    variant={hasSynced ? "secondary" : "default"}
                    className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] gap-2 transition-all duration-500 shadow-md ${hasSynced ? "bg-green-500/10 text-green-600 border border-green-500/20" : ""}`}
                    onClick={handleSync}
                  >
                    {hasSynced ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 animate-in zoom-in" />{" "}
                        Synced!
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" /> Save Progress
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center pb-12 space-y-4">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.4em] opacity-40">
                Adaptive Command Center
              </p>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-muted-foreground sm:hidden"
              >
                <Link href="/">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="relative">
              <BookOpen className="h-16 w-16 text-primary/10" />
              <Loader2 className="h-16 w-16 animate-spin text-primary absolute inset-0" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
              Initializing Session
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
