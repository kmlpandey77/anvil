import type { RunResult } from "@/lib/run";

export function RunResultPanel({ result }: { result: RunResult }) {
  return (
    <div className="max-h-64 overflow-auto border-t bg-muted/30 p-4 font-mono text-xs">
      {result.stdout && <pre className="whitespace-pre-wrap">{result.stdout}</pre>}
      {result.stderr && (
        <pre className="whitespace-pre-wrap text-destructive">{result.stderr}</pre>
      )}
      {!result.stdout && !result.stderr && (
        <span className="text-muted-foreground">
          (no output — exit {result.success ? "0" : "non-zero"})
        </span>
      )}
    </div>
  );
}
