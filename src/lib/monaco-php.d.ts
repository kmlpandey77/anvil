// monaco-editor ships this module as plain .js with no .d.ts — it's the raw
// data (Monarch tokenizer + language configuration) behind the built-in
// "php" language, which monaco-setup.ts reuses directly. See the comment
// there for why.
declare module "monaco-editor/languages/definitions/php/php" {
  import type { languages } from "monaco-editor/editor/editor.api";

  export const conf: languages.LanguageConfiguration;
  export const language: languages.IMonarchLanguage;
}
