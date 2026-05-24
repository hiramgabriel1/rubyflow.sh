mod terminal;
mod fs;

use fs::{fs_list_dir, fs_read_file, fs_write_file, fs_get_cwd, fs_get_parent};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(terminal::SessionManager::new())
        .invoke_handler(tauri::generate_handler![
            greet,
            terminal::terminal_create,
            terminal::terminal_write,
            terminal::terminal_resize,
            terminal::terminal_close,
            terminal::terminal_list,
            fs_list_dir,
            fs_read_file,
            fs_write_file,
            fs_get_cwd,
            fs_get_parent
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
