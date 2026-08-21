import { useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { readEnv, writeEnv } from "@/lib/env";
import { useEditorSettings } from "@/lib/settings";
import type { Product } from "@/lib/products";
import { toast } from "sonner";

export function EnvEditor({ product }: { product: Product }) {
  const [code, setCode] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { resolvedTheme } = useTheme();
  const { fontSize, fontFamily } = useEditorSettings();

  const saveRef = useRef<() => void>(() => {});

  function load() {
    setLoading(true);
    readEnv(product.id)
      .then((content) => {
        setCode(content);
        setSaved(content);
      })
      .catch((e) => toast.error(String(e)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [product.id]);

  async function save() {
    setSaving(true);
    try {
      await writeEnv(product.id, code);
      setSaved(code);
      toast.success("Saved .env");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }
  saveRef.current = save;

  const dirty = code !== saved;

  const handleMount: OnMount = (editor, monacoNs) => {
    editor.addCommand(monacoNs.KeyMod.CtrlCmd | monacoNs.KeyCode.KeyS, () => saveRef.current());
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs text-muted-foreground">
          .env{dirty && " — unsaved changes"}
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            Reload
          </Button>
          <Button size="sm" onClick={save} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save (⌘S)"}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          language="ini"
          value={code}
          onChange={(value) => setCode(value ?? "")}
          onMount={handleMount}
          theme={resolvedTheme === "dark" ? "ray-dark" : "ray-light"}
          options={{
            fontSize,
            fontFamily,
            minimap: { enabled: false },
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
