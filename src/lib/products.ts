import { invoke } from "@tauri-apps/api/core";

export type Product = {
  id: string;
  name: string;
  path: string;
  php_binary: string;
};

export function listProducts(): Promise<Product[]> {
  return invoke("list_products");
}

export function addProduct(input: {
  name: string;
  path: string;
  phpBinary: string;
}): Promise<Product> {
  return invoke("add_product", {
    name: input.name,
    path: input.path,
    phpBinary: input.phpBinary,
  });
}

export function removeProduct(id: string): Promise<void> {
  return invoke("remove_product", { id });
}
