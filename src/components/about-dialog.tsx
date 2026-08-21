import { Info } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAppStats, formatBytes, type AppStats } from "@/lib/app-stats";

export function AboutDialog() {
  const [stats, setStats] = useState<AppStats | null>(null);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) getAppStats().then(setStats).catch(() => setStats(null));
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="About">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About Anvil</DialogTitle>
        </DialogHeader>
        {stats ? (
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Version</span>
              <span>v{stats.version}</span>
            </div>
            <div className="flex justify-between">
              <span>Storage used</span>
              <span>{formatBytes(stats.storage_bytes)}</span>
            </div>
            <div className="flex justify-between">
              <span>Memory used</span>
              <span>{formatBytes(stats.ram_bytes)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
