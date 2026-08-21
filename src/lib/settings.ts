import { useEffect, useState } from "react";

export const FONT_FAMILIES = [
  { label: "System Monospace", value: "ui-monospace, Menlo, Consolas, monospace" },
  { label: "Fira Code", value: "'Fira Code', ui-monospace, monospace" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', ui-monospace, monospace" },
  { label: "Courier New", value: "'Courier New', monospace" },
] as const;

const DEFAULT_FONT_SIZE = 14;
const DEFAULT_FONT_FAMILY = FONT_FAMILIES[0].value;

function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ponytail: private browsing / storage disabled — setting just won't persist
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export function useEditorSettings() {
  const [fontSize, setFontSize] = useLocalStorage("editorFontSize", DEFAULT_FONT_SIZE);
  const [fontFamily, setFontFamily] = useLocalStorage<string>("editorFontFamily", DEFAULT_FONT_FAMILY);
  return { fontSize, setFontSize, fontFamily, setFontFamily };
}
