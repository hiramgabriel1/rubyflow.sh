mod session;

use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use session::TerminalSession;
use std::collections::HashMap;
use std::sync::Arc;
use std::io::Read;
use uuid::Uuid;
use tauri::Emitter;

/// Session info returned to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    pub id: String,
    pub cwd: String,
    pub cols: u16,
    pub rows: u16,
}

/// Global session manager
pub struct SessionManager {
    sessions: Arc<Mutex<HashMap<Uuid, TerminalSession>>>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Create a new terminal session and start reader thread
    pub fn create(&self, cwd: String, cols: u16, rows: u16, app_handle: &tauri::AppHandle) -> Result<Uuid, String> {
        let session = TerminalSession::new(cwd.clone(), cols, rows)?;
        let id = session.id;
        
        // Get reader for streaming output
        let reader = session.pty.try_clone_reader().map_err(|e| format!("Clone reader error: {}", e))?;
        
        // Store session
        self.sessions.lock().insert(id, session);
        
        // Start reader thread to stream output to frontend
        let id_clone = id;
        let app_handle_clone = app_handle.clone();
        std::thread::spawn(move || {
            let mut reader = reader;
            let mut buf = [0u8; 8192];
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => {
                        // EOF - process exited
                        let _ = app_handle_clone.emit(&format!("terminal://exit/{}", id_clone), ());
                        break;
                    }
                    Ok(n) => {
                        let data = String::from_utf8_lossy(&buf[..n]).to_string();
                        let _ = app_handle_clone.emit(&format!("terminal://data/{}", id_clone), data);
                    }
                    Err(_) => {
                        break;
                    }
                }
            }
        });
        
        Ok(id)
    }

    /// Write data to a session
    pub fn write(&self, id: Uuid, data: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock();
        if let Some(session) = sessions.get_mut(&id) {
            session.write(data)
        } else {
            Err("Session not found".to_string())
        }
    }

    /// Resize a session
    pub fn resize(&self, id: Uuid, cols: u16, rows: u16) -> Result<(), String> {
        let mut sessions = self.sessions.lock();
        if let Some(session) = sessions.get_mut(&id) {
            session.resize(cols, rows)
        } else {
            Err("Session not found".to_string())
        }
    }

    /// Close a session
    pub fn close(&self, id: Uuid) -> Result<(), String> {
        let mut sessions = self.sessions.lock();
        if let Some(session) = sessions.get_mut(&id) {
            session.kill()?;
        }
        sessions.remove(&id);
        Ok(())
    }

    /// List all sessions
    pub fn list(&self) -> Vec<SessionInfo> {
        self.sessions
            .lock()
            .iter()
            .map(|(id, session)| SessionInfo {
                id: id.to_string(),
                cwd: session.cwd.clone(),
                cols: session.cols,
                rows: session.rows,
            })
            .collect()
    }
}

/// Tauri command: Create a new terminal session
#[tauri::command]
pub fn terminal_create(
    app: tauri::AppHandle,
    state: tauri::State<SessionManager>,
    cwd: String,
    cols: u16,
    rows: u16,
) -> Result<String, String> {
    let id = state.create(cwd, cols, rows, &app)?;
    Ok(id.to_string())
}

/// Tauri command: Write to a terminal session
#[tauri::command]
pub fn terminal_write(
    state: tauri::State<SessionManager>,
    id: String,
    data: String,
) -> Result<(), String> {
    let uuid = Uuid::parse_str(&id).map_err(|e| format!("Invalid UUID: {}", e))?;
    state.write(uuid, &data)
}

/// Tauri command: Resize a terminal session
#[tauri::command]
pub fn terminal_resize(
    state: tauri::State<SessionManager>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let uuid = Uuid::parse_str(&id).map_err(|e| format!("Invalid UUID: {}", e))?;
    state.resize(uuid, cols, rows)
}

/// Tauri command: Close a terminal session
#[tauri::command]
pub fn terminal_close(
    state: tauri::State<SessionManager>,
    id: String,
) -> Result<(), String> {
    let uuid = Uuid::parse_str(&id).map_err(|e| format!("Invalid UUID: {}", e))?;
    state.close(uuid)
}

/// Tauri command: List all terminal sessions
#[tauri::command]
pub fn terminal_list(
    state: tauri::State<SessionManager>,
) -> Vec<SessionInfo> {
    state.list()
}
