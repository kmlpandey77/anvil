import { invoke } from "@tauri-apps/api/core";

export function readEnv(productId: string): Promise<string> {
  return invoke("read_env", { productId });
}

export function writeEnv(productId: string, content: string): Promise<void> {
  return invoke("write_env", { productId, content });
}
