import { invoke } from "@tauri-apps/api/core";

export type AppStats = {
  version: string;
  storage_bytes: number;
  ram_bytes: number;
};

export function getAppStats(): Promise<AppStats> {
  return invoke("get_app_stats");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}
