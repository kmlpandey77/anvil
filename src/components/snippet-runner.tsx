import { useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { RunResultPanel } from "@/components/run-result-panel";
import { runSnippet, type RunResult } from "@/lib/run";
import { listSymbols, registerPhpCompletionProviders, type Symbols } from "@/lib/symbols";
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
  const [editorMounted, setEditorMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const { fontSize, fontFamily } = useEditorSettings();

  const monacoRef = useRef<typeof Monaco | null>(null);
  const runRef = useRef<() => void>(() => {});

  useEffect(() => {
    setSymbols(EMPTY_SYMBOLS);
    listSymbols(product.id)
      .then(setSymbols)
      .catch((e) => toast.error(`Autocomplete unavailable: ${e}`));
  }, [product.id]);

  // registerCompletionItemProvider is global (per language, not per editor
  // instance) — must dispose the previous registration whenever product/
  // symbols change, or suggestions stack and duplicate.
  useEffect(() => {
    if (!monacoRef.current) return;
    return registerPhpCompletionProviders(monacoRef.current, product.id, symbols);
  }, [product.id, symbols, editorMounted]);

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
  runRef.current = run;

  const handleMount: OnMount = (editor, monacoNs) => {
    monacoRef.current = monacoNs;
    editor.addCommand(monacoNs.KeyMod.CtrlCmd | monacoNs.KeyCode.Enter, () => runRef.current());
    setEditorMounted(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end border-b px-4 py-2">
        <Button size="sm" onClick={run} disabled={running}>
          {running ? "Running…" : "Run (⌘⏎)"}
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          language="php"
          value={code}
          onChange={(value) => setCode(value ?? "")}
          onMount={handleMount}
          theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
          options={{
            fontSize,
            fontFamily,
            minimap: { enabled: false },
            automaticLayout: true,
          }}
        />
      </div>
      {result && <RunResultPanel result={result} />}
    </div>
  );
}
