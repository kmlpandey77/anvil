// Import only the editor core + PHP language, not the full monaco-editor
// barrel — that pulls in a Monarch tokenizer for every language it ships
// (Kotlin, COBOL, Redis, ...), bloating the bundle for languages we never use.
import * as monaco from "monaco-editor/editor/editor.api";
import "monaco-editor/languages/definitions/php/register";
import { loader } from "@monaco-editor/react";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";

// Desktop app — must work offline. @monaco-editor/react defaults to loading
// Monaco from a CDN; point it at the locally bundled package instead, and
// give it a worker (Vite's ?worker import) so the editor doesn't fall back
// to a degraded no-worker mode.
(self as unknown as { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};

loader.config({ monaco });
