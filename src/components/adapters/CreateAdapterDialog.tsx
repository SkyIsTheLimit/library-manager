"use client";

import { useState, useEffect } from "react";
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
import { Settings2, HelpCircle, Edit2 } from "lucide-react";
import { AdapterDefinition } from "@/lib/adapters/types";
import { syncService } from "@/lib/sync";
import { useIsMobile } from "@/lib/hooks/use-mobile";

interface AdapterFormDialogProps {
  adapter?: AdapterDefinition;
  onSaved?: () => void;
  trigger?: React.ReactNode;
}

export function AdapterFormDialog({
  adapter,
  onSaved,
  trigger,
}: AdapterFormDialogProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(adapter?.name || "");
  const [urlPattern, setUrlPattern] = useState(adapter?.urlMatchPattern || "");
  const [urlTemplate, setUrlTemplate] = useState(
    adapter?.readerUrlTemplate || "",
  );
  const [error, setError] = useState("");

  // Sync state if adapter prop changes (important for editing)
  useEffect(() => {
    if (adapter) {
      setName(adapter.name);
      setUrlPattern(adapter.urlMatchPattern);
      setUrlTemplate(adapter.readerUrlTemplate);
    }
  }, [adapter]);

  const handleSave = async () => {
    if (!name || !urlPattern || !urlTemplate) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const id =
        adapter?.id ||
        name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

      const definition = {
        ...adapter, // Keep existing selectors if they exist
        id,
        name,
        urlMatchPattern: urlPattern,
        readerUrlTemplate: urlTemplate,
        titleSelector: adapter?.titleSelector || 'meta[property="og:title"]',
        authorSelector: adapter?.authorSelector || 'meta[name="author"]',
        coverSelector: adapter?.authorSelector || 'meta[property="og:image"]',
        updatedAt: Date.now(),
      };

      if (adapter) {
        await db.adapters.put(definition);
      } else {
        await db.adapters.add(definition);
      }

      syncService.triggerSync();
      setOpen(false);
      if (!adapter) {
        setName("");
        setUrlPattern("");
        setUrlTemplate("");
      }
      setError("");
      if (onSaved) onSaved();
    } catch (err: any) {
      setError("Failed to save adapter: " + err.message);
    }
  };

  const formContent = (
    <div className="grid gap-6 py-4 px-4 sm:px-0">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Adapter Name</label>
          <Input
            placeholder="e.g. My Proxy"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl bg-secondary/50 border-none focus-visible:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 ml-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              URL Match Pattern (Regex)
            </label>
            <HelpCircle className="h-3 w-3 text-muted-foreground opacity-50" />
          </div>
          <Input
            placeholder="e.g. my-proxy\.com"
            value={urlPattern}
            onChange={(e) => setUrlPattern(e.target.value)}
            className="h-12 rounded-xl bg-secondary/50 border-none focus-visible:ring-primary/20 font-mono text-xs"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 ml-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Reader URL Template</label>
            <HelpCircle className="h-3 w-3 text-muted-foreground opacity-50" />
          </div>
          <Input
            placeholder="https://proxy.com/view/{slug}/{externalId}/"
            value={urlTemplate}
            onChange={(e) => setUrlTemplate(e.target.value)}
            className="h-12 rounded-xl bg-secondary/50 border-none focus-visible:ring-primary/20 font-mono text-xs"
          />
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest px-1 opacity-50">
            Use {"{externalId}"} and {"{slug}"} as placeholders.
          </p>
        </div>
        {error && <p className="text-[11px] font-bold text-destructive px-1">{error}</p>}
      </div>
      <Button 
        size="lg"
        onClick={handleSave} 
        className="h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20"
      >
        {adapter ? "Update Adapter" : "Create Adapter"}
      </Button>
    </div>
  );

  const defaultTrigger = adapter ? (
    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
      <Edit2 className="h-3.5 w-3.5" />
    </Button>
  ) : (
    <Button
      variant="ghost"
      size="xs"
      className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary hover:bg-primary/5 h-8 px-4 rounded-full border border-primary/10"
    >
      <Settings2 className="h-3.5 w-3.5 mr-2" /> Create Adapter
    </Button>
  );

  const activeTrigger = trigger || defaultTrigger;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{activeTrigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl font-black uppercase tracking-tight">
              {adapter ? "Edit Adapter" : "New Adapter"}
            </DrawerTitle>
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
      <DialogTrigger asChild>{activeTrigger}</DialogTrigger>
      <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            {adapter ? "Edit Adapter" : "Create Adapter"}
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
