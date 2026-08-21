import { useTheme } from "next-themes";
import type { RunResult } from "@/lib/run";

// Laravel's dump()/dd() (Symfony VarDumper) — forced into its HTML dumper via
// VAR_DUMPER_FORMAT=html in exec_php — emit a self-contained <pre class=sf-dump>
// fragment with its own inline <style>/<script> for the collapsible tree. An
// iframe is the simplest safe way to render that: fully isolated from our own
// app's DOM/CSS/JS, and it's also why Artisan output (route lists contain
// literal `<id>` placeholders) must NOT use this — only pass renderHtml for
// Tinker, where stdout is either dump() output or plain echoed text (both
// render fine inside the iframe body).
function iframeDoc(stdout: string, dark: boolean): string {
  // Matches index.css's --background/--foreground for this theme (a separate
  // document can't read the app's CSS variables, so the hex is duplicated by
  // hand here) — Symfony's own sf-dump box carries its own near-black/orange
  // styling regardless, this only sets what shows around it and behind plain
  // echoed text.
  const bg = dark ? "#241a3d" : "#faf8fd";
  const fg = dark ? "#e9e4f5" : "#221a3a";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; padding: 12px; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; background: ${bg}; color: ${fg}; }
  </style></head><body>${stdout}</body></html>`;
}

export function RunResultPanel({
  result,
  renderHtml = false,
}: {
  result: RunResult | null;
  renderHtml?: boolean;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex h-full flex-col overflow-hidden border-l bg-muted/30">
      {!result && (
        <span className="p-5 font-mono text-xs text-muted-foreground">
          Run to see output.
        </span>
      )}
      {result?.stdout &&
        (renderHtml ? (
          <iframe
            title="Result"
            className="flex-1 border-0"
            sandbox="allow-scripts"
            srcDoc={iframeDoc(result.stdout, resolvedTheme === "dark")}
          />
        ) : (
          <pre className="overflow-auto p-5 font-mono text-xs whitespace-pre-wrap">
            {result.stdout}
          </pre>
        ))}
      {result?.stderr && (
        <pre className="overflow-auto p-5 font-mono text-xs whitespace-pre-wrap text-destructive">
          {result.stderr}
        </pre>
      )}
      {result && !result.stdout && !result.stderr && (
        <span className="p-5 font-mono text-xs text-muted-foreground">
          (no output — exit {result.success ? "0" : "non-zero"})
        </span>
      )}
    </div>
  );
}
