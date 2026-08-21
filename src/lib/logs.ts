import { invoke } from "@tauri-apps/api/core";

export function readLogTail(productId: string): Promise<string> {
  return invoke("read_log_tail", { productId });
}
