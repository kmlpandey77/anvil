import { invoke } from "@tauri-apps/api/core";
import type { Completion, CompletionContext, CompletionSource } from "@codemirror/autocomplete";

export type Symbols = {
  classes: string[];
  functions: string[];
};

export function listSymbols(productId: string): Promise<Symbols> {
  return invoke("list_symbols", { productId });
}

// Fully-qualified since a REPL snippet has no persistent `use` imports.
export function makeCompletionSource(symbols: Symbols): CompletionSource {
  const options: Completion[] = [
    ...PHP_KEYWORDS.map((label): Completion => ({ label, type: "keyword" })),
    ...symbols.functions.map((label): Completion => ({ label, type: "function" })),
    ...symbols.classes.map(
      (label): Completion => ({
        label,
        type: "class",
        apply: label.startsWith("\\") ? label : `\\${label}`,
      }),
    ),
  ];

  return (context: CompletionContext) => {
    const word = context.matchBefore(/[\\\w]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    return { from: word.from, options, validFor: /^[\\\w]*$/ };
  };
}

// Core PHP language keywords — not project-specific, always useful.
export const PHP_KEYWORDS = [
  "abstract", "and", "array", "as", "break", "callable", "case", "catch",
  "class", "clone", "const", "continue", "declare", "default", "do", "echo",
  "else", "elseif", "empty", "enum", "extends", "final", "finally", "fn",
  "for", "foreach", "function", "global", "if", "implements", "include",
  "instanceof", "interface", "isset", "list", "match", "namespace", "new",
  "or", "print", "private", "protected", "public", "readonly", "require",
  "return", "static", "switch", "throw", "trait", "try", "unset", "use",
  "var", "while", "xor", "yield",
];
