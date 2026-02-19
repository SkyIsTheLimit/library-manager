"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/db";
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
import { Settings2, HelpCircle, Edit2 } from "lucide-react";
import { AdapterDefinition } from "@/lib/adapters/types";

interface AdapterFormDialogProps {
  adapter?: AdapterDefinition;
  onSaved?: () => void;
  trigger?: React.ReactNode;
}

export function AdapterFormDialog({ adapter, onSaved, trigger }: AdapterFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(adapter?.name || "");
  const [urlPattern, setUrlPattern] = useState(adapter?.urlMatchPattern || "");
  const [urlTemplate, setUrlTemplate] = useState(adapter?.readerUrlTemplate || "");
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
      const id = adapter?.id || (name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now());
      
      const definition: AdapterDefinition = {
        ...adapter, // Keep existing selectors if they exist
        id,
        name,
        urlMatchPattern: urlPattern,
        readerUrlTemplate: urlTemplate,
        titleSelector: adapter?.titleSelector || 'meta[property="og:title"]',
        authorSelector: adapter?.authorSelector || 'meta[name="author"]',
        coverSelector: adapter?.coverSelector || 'meta[property="og:image"]',
      };

      if (adapter) {
        // Find existing record ID for update if using Dexie auto-inc
        const existing = await db.adapters.where("id").equals(adapter.id).first();
        if (existing?.id) {
          await db.adapters.update(existing.id as any, definition);
        } else {
          await db.adapters.put(definition);
        }
      } else {
        await db.adapters.add(definition);
      }

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

  const defaultTrigger = adapter ? (
    <Button variant="ghost" size="icon-xs" className="h-6 w-6">
      <Edit2 className="h-3 w-3" />
    </Button>
  ) : (
    <Button variant="ghost" size="xs" className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary h-6 px-2">
      <Settings2 className="h-3 w-3 mr-1" /> Create Adapter
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{adapter ? "Edit Adapter" : "Create Custom Adapter"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Adapter Name</label>
            <Input
              placeholder="e.g. My Proxy"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">URL Match Pattern (Regex)</label>
              <HelpCircle className="h-3 w-3 text-muted-foreground" title="Regex to match the source URL" />
            </div>
            <Input
              placeholder="e.g. my-proxy\.com"
              value={urlPattern}
              onChange={(e) => setUrlPattern(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Reader URL Template</label>
              <HelpCircle className="h-3 w-3 text-muted-foreground" title="Template for generating the proxy URL" />
            </div>
            <Input
              placeholder="https://proxy.com/view/{slug}/{externalId}/"
              value={urlTemplate}
              onChange={(e) => setUrlTemplate(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground italic">
              Use {"{externalId}"} and {"{slug}"} as placeholders.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="w-full">
            {adapter ? "Update Adapter" : "Create Adapter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
