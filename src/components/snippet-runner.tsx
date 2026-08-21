import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { php } from "@codemirror/lang-php";
import { autocompletion } from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import { Button } from "@/components/ui/button";
import { runSnippet, type RunResult } from "@/lib/run";
import {
  listSymbols,
  makeCompletionSource,
  makeMemberCompletionSource,
  type Symbols,
} from "@/lib/symbols";
import { useEditorSettings } from "@/lib/settings";
import type { Product } from "@/lib/products";
import { toast } from "sonner";

const DEFAULT_SNIPPET = "User::count()";
const EMPTY_SYMBOLS: Symbols = { classes: [], functions: [] };

export function SnippetRunner({ product }: { product: Product }) {
  const [code, setCode] = useState(DEFAULT_SNIPPET);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [symbols, setSymbols] = useState<Symbols>(EMPTY_SYMBOLS);
  const { fontSize, fontFamily } = useEditorSettings();

  useEffect(() => {
    setSymbols(EMPTY_SYMBOLS);
    listSymbols(product.id)
      .then(setSymbols)
      .catch((e) => toast.error(`Autocomplete unavailable: ${e}`));
  }, [product.id]);

  const extensions = useMemo(
    () => [
      // plain: true — snippets are raw PHP with no <?php tag, not a
      // template file. Without it the parser expects HTML and never
      // recognizes any PHP tokens, so nothing gets highlighted.
      php({ plain: true }),
      autocompletion({
        override: [
          makeMemberCompletionSource(product.id, symbols.classes),
          makeCompletionSource(symbols),
        ],
      }),
      EditorView.theme({
        "&": { fontSize: `${fontSize}px` },
        ".cm-content, .cm-gutters": { fontFamily },
      }),
    ],
    [product.id, symbols, fontSize, fontFamily],
  );

  async function run() {
    setRunning(true);
    try {
      setResult(await runSnippet(product.id, code));
    } catch (e) {
      setResult({ stdout: "", stderr: String(e), success: false });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      className="flex h-full flex-col"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          run();
        }
      }}
    >
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">{product.name}</span>
        <Button size="sm" onClick={run} disabled={running}>
          {running ? "Running…" : "Run (⌘⏎)"}
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={code}
          onChange={setCode}
          extensions={extensions}
          height="100%"
          basicSetup={{ lineNumbers: true }}
          autoFocus
        />
      </div>
      {result && (
        <div className="max-h-64 overflow-auto border-t bg-muted/30 p-4 font-mono text-xs">
          {result.stdout && (
            <pre className="whitespace-pre-wrap">{result.stdout}</pre>
          )}
          {result.stderr && (
            <pre className="whitespace-pre-wrap text-destructive">
              {result.stderr}
            </pre>
          )}
          {!result.stdout && !result.stderr && (
            <span className="text-muted-foreground">
              (no output — exit {result.success ? "0" : "non-zero"})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
