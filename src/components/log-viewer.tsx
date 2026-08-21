import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readLogTail } from "@/lib/logs";
import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 2000;
const NEAR_BOTTOM_PX = 40;

function lineClassName(line: string): string {
  if (/\.ERROR:|\.CRITICAL:|\.EMERGENCY:|\.ALERT:/.test(line)) return "text-destructive";
  if (/\.WARNING:/.test(line)) return "text-yellow-600 dark:text-yellow-400";
  return "";
}

export function LogViewer({ product }: { product: Product }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    try {
      const tail = await readLogTail(product.id);
      setError(null);
      const container = containerRef.current;
      const wasNearBottom =
        !container ||
        container.scrollHeight - container.scrollTop - container.clientHeight < NEAR_BOTTOM_PX;
      setText(tail);
      if (wasNearBottom) {
        requestAnimationFrame(() => {
          container?.scrollTo({ top: container.scrollHeight });
        });
      }
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    setText(null);
    setError(null);
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs text-muted-foreground">
          storage/logs — refreshing every {POLL_INTERVAL_MS / 1000}s
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto p-4 font-mono text-xs">
        {error && <p className="text-destructive">{error}</p>}
        {!error &&
          text?.split("\n").map((line, i) => (
            <div key={i} className={cn("whitespace-pre-wrap", lineClassName(line))}>
              {line}
            </div>
          ))}
        {!error && text === null && (
          <p className="text-muted-foreground">Loading…</p>
        )}
      </div>
    </div>
  );
}
