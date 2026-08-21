import type { RunResult } from "@/lib/run";

export function RunResultPanel({ result }: { result: RunResult | null }) {
  return (
    <div className="h-full overflow-auto border-l bg-muted/30 p-4 font-mono text-xs">
      {!result && <span className="text-muted-foreground">Run to see output.</span>}
      {result?.stdout && <pre className="whitespace-pre-wrap">{result.stdout}</pre>}
      {result?.stderr && (
        <pre className="whitespace-pre-wrap text-destructive">{result.stderr}</pre>
      )}
      {result && !result.stdout && !result.stderr && (
        <span className="text-muted-foreground">
          (no output — exit {result.success ? "0" : "non-zero"})
        </span>
      )}
    </div>
  );
}
