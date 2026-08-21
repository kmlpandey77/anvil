import { invoke } from "@tauri-apps/api/core";

export type QueryResult = {
  columns: string[];
  rows: string[][];
};

export function runQuery(productId: string, sql: string): Promise<QueryResult> {
  return invoke("run_query", { productId, sql });
}
