use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Product {
    id: String,
    name: String,
    path: String,
    php_binary: String,
}

fn products_file(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("could not resolve app data dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("products.json"))
}

fn read_products(app: &AppHandle) -> Result<Vec<Product>, String> {
    let file = products_file(app)?;
    if !file.exists() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&file).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

fn write_products(app: &AppHandle, products: &[Product]) -> Result<(), String> {
    let file = products_file(app)?;
    let raw = serde_json::to_string_pretty(products).map_err(|e| e.to_string())?;
    fs::write(&file, raw).map_err(|e| e.to_string())
}

fn new_id() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("{nanos:x}")
}

#[tauri::command]
fn list_products(app: AppHandle) -> Result<Vec<Product>, String> {
    read_products(&app)
}

#[tauri::command]
fn add_product(
    app: AppHandle,
    name: String,
    path: String,
    php_binary: String,
) -> Result<Product, String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("Name is required.".into());
    }
    if !PathBuf::from(&path).join("artisan").is_file() {
        return Err(format!("No 'artisan' file found at {path} — is this a Laravel project root?"));
    }
    let php_binary = {
        let trimmed = php_binary.trim();
        if trimmed.is_empty() { "php".to_string() } else { trimmed.to_string() }
    };

    let mut products = read_products(&app)?;
    let product = Product {
        id: new_id(),
        name: name.to_string(),
        path,
        php_binary,
    };
    products.push(product.clone());
    write_products(&app, &products)?;
    Ok(product)
}

#[tauri::command]
fn remove_product(app: AppHandle, id: String) -> Result<(), String> {
    let mut products = read_products(&app)?;
    products.retain(|p| p.id != id);
    write_products(&app, &products)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_products,
            add_product,
            remove_product
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
