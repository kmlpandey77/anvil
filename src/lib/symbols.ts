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

export type Member = { name: string; kind: "method" | "property"; is_static: boolean };

export function listMembers(productId: string, className: string): Promise<{ members: Member[] }> {
  return invoke("list_members", { productId, className });
}

// Resolve a typed class name against the project's known classes (by exact
// or short-name match); otherwise pass it through as-is so already-fully-
// qualified vendor/framework classes (e.g. \Illuminate\Support\Str) still work.
function resolveClassName(typed: string, classes: string[]): string {
  const clean = typed.replace(/^\\/, "");
  if (classes.includes(clean)) return clean;
  const short = clean.split("\\").pop();
  const match = classes.find((c) => c.split("\\").pop() === short);
  return match ?? clean;
}

// Member completion after `Class::` or after `$var->` where `$var` was
// assigned via `$var = new ClassName(` earlier in the buffer — a simple
// backward regex scan, not real type inference, so chained calls like
// `User::first()->` won't resolve. See PLAN.md for the upgrade path.
export function makeMemberCompletionSource(
  productId: string,
  classes: string[],
): CompletionSource {
  return async (context: CompletionContext) => {
    const staticMatch = context.matchBefore(/(\\?[\w\\]+)::(\w*)$/);
    const instanceMatch = context.matchBefore(/\$(\w+)->(\w*)$/);

    let className: string | undefined;
    let from: number;

    if (staticMatch) {
      const m = /^(\\?[\w\\]+)::(\w*)$/.exec(staticMatch.text)!;
      className = m[1];
      from = staticMatch.from + m[0].length - m[2].length;
    } else if (instanceMatch) {
      const m = /^\$(\w+)->(\w*)$/.exec(instanceMatch.text)!;
      const varName = m[1];
      const doc = context.state.doc.toString();
      const assignRe = new RegExp(`\\$${varName}\\s*=\\s*new\\s+(\\\\?[\\w\\\\]+)\\s*\\(`, "g");
      let match: RegExpExecArray | null;
      let last: RegExpExecArray | null = null;
      while ((match = assignRe.exec(doc))) last = match;
      if (!last) return null;
      className = last[1];
      from = instanceMatch.from + m[0].length - m[2].length;
    } else {
      return null;
    }

    const fqcn = resolveClassName(className, classes);
    try {
      const { members } = await listMembers(productId, fqcn);
      const options: Completion[] = members.map((m) => ({
        label: m.name,
        type: m.kind,
        apply: m.kind === "method" ? `${m.name}()` : m.name,
      }));
      return { from, options };
    } catch {
      return null;
    }
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
