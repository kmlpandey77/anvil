// editor.main.js, not the bare editor.api — the API surface alone doesn't
// register editor FEATURES (suggest widget, hover, find, bracket matching,
// ~60 separate contrib/* modules); without it there's no suggest controller
// to even show a completion dropdown. It also registers (lazily) every
// language Monaco ships, but that's cheap: each one is just a small
// registration + an async loader, and the actual tokenizer module for a
// language only downloads if that language is actually used — confirmed via
// the per-language chunks in the build output (kotlin-*.js, redis-*.js, ...
// stay unfetched since we only ever use "php").
import "monaco-editor/editor/editor.main";
import * as monaco from "monaco-editor/editor/editor.api";
import { conf, language as phpLanguage } from "monaco-editor/languages/definitions/php/php";
import { loader } from "@monaco-editor/react";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";

// Desktop app — must work offline. @monaco-editor/react defaults to loading
// Monaco from a CDN; point it at the locally bundled package instead, and
// give it a worker (Vite's ?worker import) so the editor doesn't fall back
// to a degraded no-worker mode.
(self as unknown as { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};

// Monaco's built-in "php" language is built for .php FILES that mix HTML with
// <?php ?> blocks: its `root` tokenizer state only switches into real PHP
// token rules once it sees an opening <?php tag — a bare snippet with no tag
// never leaves HTML-detection mode, so everything renders as one uncolored
// run of plain text. Our snippets ARE the PHP, no surrounding HTML and no
// tag, so register our own tokenizer that reuses Monaco's actual PHP rules
// (the self-contained `phpRoot` state, normally only reached via the tag)
// directly as the entry point, skipping HTML-detection entirely.
monaco.languages.register({ id: "php", extensions: [".php"], aliases: ["PHP", "php"] });
monaco.languages.setLanguageConfiguration("php", conf);
monaco.languages.setMonarchTokensProvider("php", {
  ...phpLanguage,
  tokenizer: { ...phpLanguage.tokenizer, root: phpLanguage.tokenizer.phpRoot },
});

loader.config({ monaco });
