import { invoke } from "@tauri-apps/api/core";

export type Snippet = {
  id: string;
  product_id: string;
  name: string;
  code: string;
};

export function listSnippets(productId: string): Promise<Snippet[]> {
  return invoke("list_snippets", { productId });
}

export function saveSnippet(productId: string, name: string, code: string): Promise<Snippet> {
  return invoke("save_snippet", { productId, name, code });
}

export function deleteSnippet(id: string): Promise<void> {
  return invoke("delete_snippet", { id });
}
