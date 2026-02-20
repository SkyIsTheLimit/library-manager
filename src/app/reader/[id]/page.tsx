"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/database/dexie";
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
  PanelLeftClose,
  PanelLeftOpen,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";

import { libraryService } from "@/lib/services/library";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/lib/hooks/use-mobile";

export default function UniversalController() {
  const { id } = useParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const books = useLiveQuery(() => db.books.filter(b => !b.deleted).toArray());
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
  const [showPreview, setShowPreview] = useState(false);

  // Auto-hide sidebar if screen is narrow (like iPad Split View)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    if (!isMobile) {
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isMobile]);

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

  // Automatically enable preview on large screens if possible
  useEffect(() => {
    if (!isMobile && window.innerWidth > 1024 && activeBook) {
      setShowPreview(true);
    }
  }, [isMobile, activeBook?.id]);

  const handleSync = async () => {
    if (!activeBook) return;
    await libraryService.updateProgress(activeBook.externalId, {
      currentChapterTitle: chapter,
      currentChapterUrl: chapterUrl,
      percentComplete: Number(percent)
    });
    setHasSynced(true);
    setTimeout(() => setHasSynced(false), 2000);
  };

  const currentBookUrl = chapterUrl || activeBook?.readerUrl;

  const openBook = () => {
    if (currentBookUrl) {
      window.open(currentBookUrl, "_blank");
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center whitespace-nowrap">
        <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> My Library
        </h2>
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-3 space-y-1">
          {books?.map((book) => (
            <Button
              key={book.id}
              variant={id === book.externalId ? "secondary" : "ghost"}
              className={`w-full justify-start text-[11px] h-auto py-3 px-4 text-left rounded-xl font-bold uppercase tracking-tight ${id === book.externalId ? "bg-primary/10 text-primary border border-primary/20" : ""}`}
              asChild
            >
              <Link href={`/reader/${book.externalId}`}>
                <span className="line-clamp-2">{book.title}</span>
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  if (!activeBook) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)] gap-6">
        <div className="relative">
          <BookOpen className="h-16 w-16 text-primary/10" />
          <Loader2 className="h-16 w-16 animate-spin text-primary absolute inset-0" />
        </div>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
          Initializing Session
        </p>
      </div>
    );
  }

  const controllerContent = (
    <div className={`flex flex-col items-center ${showPreview ? "p-4" : "p-4 md:p-8"} w-full`}>
      {/* Adaptive Header */}
      <div className="w-full max-w-xl flex justify-between items-center mb-8 gap-4">
        <div className="flex gap-2">
          {isMobile ? (
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-background/50 backdrop-blur shadow-sm">
                  <PanelLeftOpen className="h-5 w-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[80vh]">
                <DrawerHeader className="hidden">
                  <DrawerTitle>Library</DrawerTitle>
                </DrawerHeader>
                {sidebarContent}
              </DrawerContent>
            </Drawer>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-full bg-background/50 backdrop-blur shadow-sm"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="rounded-full hidden sm:flex bg-background/50 backdrop-blur shadow-sm font-bold uppercase text-[10px] tracking-widest px-4"
          >
            <Link href="/">
              <Home className="h-4 w-4 mr-2" /> Home
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 shadow-sm backdrop-blur">
          <Clock className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {elapsed}
          </span>
        </div>
      </div>

      <div className={`${showPreview ? "w-full" : "max-w-md w-full"} space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
        <div className="text-center space-y-4 px-4">
          {!showPreview && (
            <div className="relative w-32 h-44 mx-auto shadow-2xl rounded-2xl overflow-hidden border-4 border-background transform -rotate-1 hover:rotate-0 transition-transform duration-500">
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
          )}
          <div className="space-y-1">
            <h1 className="text-lg font-black tracking-tight leading-tight line-clamp-2 uppercase">
              {activeBook.title}
            </h1>
            <p className="text-xs text-muted-foreground font-semibold italic">
              {activeBook.author}
            </p>
          </div>
        </div>

        <Card className="border-none shadow-2xl bg-card/90 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardContent className={`${showPreview ? "p-6" : "p-8"} space-y-6`}>
            <div className="space-y-3">
              <Button
                onClick={openBook}
                className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest gap-3 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center"
              >
                <ExternalLink className="h-5 w-5" />{" "}
                Open Full Tab
              </Button>
              {!isMobile && (
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/5"
                >
                  {showPreview ? "Collapse Preview" : "Split View Preview"}
                </Button>
              )}
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                  Current Chapter
                </label>
                <Input
                  placeholder="e.g. Chapter 4"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="h-12 rounded-xl bg-secondary/30 border-none text-sm px-4 focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-2">
                  <LinkIcon className="h-3 w-3" /> Deep Link (Optional)
                </label>
                <Input
                  placeholder="Paste URL to resume here"
                  value={chapterUrl}
                  onChange={(e) => setChapterUrl(e.target.value)}
                  className="h-12 rounded-xl bg-secondary/30 border-none text-[10px] px-4 focus-visible:ring-primary/20 font-mono"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end px-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Completion
                  </label>
                  <span className="text-lg font-black text-primary">
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

        {!showPreview && (
          <div className="text-center pb-12 space-y-4">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.4em] opacity-40">
              Command Center
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-background">
      {/* Sidebar - Desktop Only */}
      {!isMobile && (
        <aside
          className={`transition-all duration-300 border-r bg-muted/20 flex flex-col shrink-0 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden border-none"}`}
        >
          {sidebarContent}
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex flex-grow overflow-hidden">
        {/* Book Preview - Desktop Split View Only */}
        {!isMobile && showPreview && currentBookUrl && (
          <div className="flex-grow h-full bg-black relative">
            <iframe
              src={`/api/proxy?url=${encodeURIComponent(currentBookUrl)}`}
              className="w-full h-full border-none"
              title="Book Reader"
            />
            {/* Overlay for quick info if needed */}
          </div>
        )}

        {/* Controller Main */}
        <main 
          className={`relative flex flex-col items-center overflow-y-auto bg-secondary/5 no-scrollbar border-l transition-all duration-300 ${showPreview ? "w-[400px] shrink-0" : "flex-grow"}`}
        >
          {controllerContent}
        </main>
      </div>
    </div>
  );
}
