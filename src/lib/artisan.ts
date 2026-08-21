import { invoke } from "@tauri-apps/api/core";
import type { RunResult } from "@/lib/run";

export type ArtisanCommand = { name: string; description: string };

export function listArtisanCommands(productId: string): Promise<ArtisanCommand[]> {
  return invoke("list_artisan_commands", { productId });
}

export function runArtisanCommand(
  productId: string,
  command: string,
  args: string[],
): Promise<RunResult> {
  return invoke("run_artisan_command", { productId, command, args });
}
