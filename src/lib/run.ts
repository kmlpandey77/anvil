import { invoke } from "@tauri-apps/api/core";

export type RunResult = {
  stdout: string;
  stderr: string;
  success: boolean;
};

export function runSnippet(productId: string, code: string): Promise<RunResult> {
  return invoke("run_snippet", { productId, code });
}
