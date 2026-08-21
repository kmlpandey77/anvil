import { invoke } from "@tauri-apps/api/core";
import type * as Monaco from "monaco-editor";

export type Symbols = {
  classes: string[];
  functions: string[];
};

export function listSymbols(productId: string): Promise<Symbols> {
  return invoke("list_symbols", { productId });
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

// Replace range for the run of `pattern` chars immediately before the cursor
// on the current line — used instead of Monaco's own getWordUntilPosition
// because its default word pattern doesn't include `\`, which would leave a
// leading backslash duplicated when inserting a fully-qualified class name.
function backwardRange(
  model: Monaco.editor.ITextModel,
  position: Monaco.Position,
  pattern: RegExp,
): Monaco.IRange {
  const lineText = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
  const m = pattern.exec(lineText);
  const startColumn = m ? position.column - m[0].length : position.column;
  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn,
    endColumn: position.column,
  };
}

type BaseItem = { label: string; kind: Monaco.languages.CompletionItemKind; insertText: string };

function buildGeneralItems(monacoNs: typeof Monaco, symbols: Symbols): BaseItem[] {
  const Kind = monacoNs.languages.CompletionItemKind;
  return [
    ...PHP_KEYWORDS.map((label): BaseItem => ({ label, kind: Kind.Keyword, insertText: label })),
    ...symbols.functions.map((label): BaseItem => ({ label, kind: Kind.Function, insertText: label })),
    ...symbols.classes.map(
      (label): BaseItem => ({
        label,
        kind: Kind.Class,
        insertText: label.startsWith("\\") ? label : `\\${label}`,
      }),
    ),
  ];
}

// Registers PHP completion against Monaco's global 'php' language registry
// (registerCompletionItemProvider is process-wide, not per-editor-instance).
// Returns a dispose function — callers MUST call it before re-registering
// (e.g. when `symbols` changes) or providers stack and suggestions duplicate.
export function registerPhpCompletionProviders(
  monacoNs: typeof Monaco,
  productId: string,
  symbols: Symbols,
): () => void {
  const generalItems = buildGeneralItems(monacoNs, symbols);

  const general = monacoNs.languages.registerCompletionItemProvider("php", {
    triggerCharacters: ["\\", "$"],
    provideCompletionItems(model, position) {
      const range = backwardRange(model, position, /[\\\w]*$/);
      return { suggestions: generalItems.map((item) => ({ ...item, range })) };
    },
  });

  // Member completion after `Class::` or `$var->` where `$var` was assigned
  // via `$var = new ClassName(` earlier in the buffer — a simple backward
  // regex scan, not real type inference, so chained calls like
  // `User::first()->` won't resolve. See PLAN.md for the upgrade path.
  const member = monacoNs.languages.registerCompletionItemProvider("php", {
    triggerCharacters: [":", "-", ">"],
    async provideCompletionItems(model, position) {
      const lineUntilCursor = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
      const staticMatch = /(\\?[\w\\]+)::(\w*)$/.exec(lineUntilCursor);
      const instanceMatch = /\$(\w+)->(\w*)$/.exec(lineUntilCursor);

      let className: string | undefined;
      if (staticMatch) {
        className = staticMatch[1];
      } else if (instanceMatch) {
        const varName = instanceMatch[1];
        const doc = model.getValue();
        const assignRe = new RegExp(`\\$${varName}\\s*=\\s*new\\s+(\\\\?[\\w\\\\]+)\\s*\\(`, "g");
        let match: RegExpExecArray | null;
        let last: RegExpExecArray | null = null;
        while ((match = assignRe.exec(doc))) last = match;
        if (!last) return { suggestions: [] };
        className = last[1];
      } else {
        return { suggestions: [] };
      }

      const fqcn = resolveClassName(className, symbols.classes);
      try {
        const { members } = await listMembers(productId, fqcn);
        const range = backwardRange(model, position, /\w*$/);
        const Kind = monacoNs.languages.CompletionItemKind;
        return {
          suggestions: members.map((m) => ({
            label: m.name,
            kind: m.kind === "method" ? Kind.Method : Kind.Property,
            insertText: m.kind === "method" ? `${m.name}()` : m.name,
            range,
          })),
        };
      } catch (e) {
        console.error(`list_members(${fqcn}) failed:`, e);
        return { suggestions: [] };
      }
    },
  });

  return () => {
    general.dispose();
    member.dispose();
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
