import { Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FONT_FAMILIES, useEditorSettings } from "@/lib/settings";
import { getAppStats, formatBytes, type AppStats } from "@/lib/app-stats";

export function SettingsDialog() {
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize, fontFamily, setFontFamily } = useEditorSettings();
  const [stats, setStats] = useState<AppStats | null>(null);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) getAppStats().then(setStats).catch(() => setStats(null));
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="font-family">Editor font</Label>
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger id="font-family">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="font-size">Editor font size (px)</Label>
            <Input
              id="font-size"
              type="number"
              min={10}
              max={32}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value) || fontSize)}
            />
          </div>
          <div className="space-y-2 border-t pt-4">
            <Label>About</Label>
            {stats ? (
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Anvil</span>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
