import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RunResultPanel } from "@/components/run-result-panel";
import { StatusDot, type RunStatus } from "@/components/status-dot";
import { listArtisanCommands, runArtisanCommand, type ArtisanCommand } from "@/lib/artisan";
import type { RunResult } from "@/lib/run";
import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ArtisanRunner({ product }: { product: Product }) {
  const [commands, setCommands] = useState<ArtisanCommand[]>([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [args, setArgs] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const argsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCommands([]);
    setSelected(null);
    setResult(null);
    listArtisanCommands(product.id)
      .then(setCommands)
      .catch((e) => toast.error(String(e)));
  }, [product.id]);

  const filtered = commands.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const status: RunStatus = running
    ? "running"
    : result
      ? result.success
        ? "success"
        : "error"
      : "idle";

  async function run() {
    if (!selected) return;
    setRunning(true);
    try {
      const argv = args.trim().length > 0 ? args.trim().split(/\s+/) : [];
      setResult(await runArtisanCommand(product.id, selected, argv));
    } catch (e) {
      setResult({ stdout: "", stderr: String(e), success: false });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex w-1/2 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b p-3">
          <Input
            ref={argsRef}
            placeholder={selected ? `${selected} arguments / options` : "Select a command below"}
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && selected && !running) run();
            }}
            disabled={!selected}
          />
          <StatusDot status={status} />
          <Button size="sm" onClick={run} disabled={!selected || running}>
            {running ? "Running…" : "Run (⏎)"}
          </Button>
        </div>
        <div className="p-3 pb-0">
          <Input
            placeholder="Filter commands…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-0.5 p-3">
            {filtered.map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setSelected(c.name);
                  argsRef.current?.focus();
                }}
                className={cn(
                  "rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                  selected === c.name && "bg-accent",
                )}
              >
                <div className="font-mono">{c.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {c.description}
                </div>
              </button>
            ))}
            {commands.length > 0 && filtered.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                No matching commands.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="w-1/2">
        <RunResultPanel result={result} />
      </div>
    </div>
  );
}
