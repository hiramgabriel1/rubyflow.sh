use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem, MasterPty, ChildKiller};
use std::io::Write;
use uuid::Uuid;

/// Session data for a single terminal instance
pub struct TerminalSession {
    pub id: Uuid,
    pub cwd: String,
    pub pty: Box<dyn MasterPty + Send>,
    pub child: Box<dyn ChildKiller + Send + Sync>,
    pub writer: Box<dyn Write + Send>,
    pub cols: u16,
    pub rows: u16,
}

impl TerminalSession {
    pub fn new(cwd: String, cols: u16, rows: u16) -> Result<Self, String> {
        let pty_system = NativePtySystem::default();
        
        let mut cmd = CommandBuilder::new("/bin/zsh");
        cmd.cwd(cwd.clone());
        
        let pair = pty_system
            .openpty(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Failed to open PTY: {}", e))?;

        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| format!("Failed to spawn shell: {}", e))?;

        let writer = pair.master.take_writer().map_err(|e| format!("Writer error: {}", e))?;

        Ok(Self {
            id: Uuid::new_v4(),
            cwd,
            pty: pair.master,
            child,
            writer,
            cols,
            rows,
        })
    }

    pub fn write(&mut self, data: &str) -> Result<(), String> {
        self.writer
            .write_all(data.as_bytes())
            .map_err(|e| format!("Write error: {}", e))
    }

    pub fn resize(&mut self, cols: u16, rows: u16) -> Result<(), String> {
        self.cols = cols;
        self.rows = rows;
        self.pty
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Resize error: {}", e))
    }

    pub fn kill(&mut self) -> Result<(), String> {
        self.child
            .kill()
            .map_err(|e| format!("Kill error: {}", e))
    }
}

impl Drop for TerminalSession {
    fn drop(&mut self) {
        let _ = self.kill();
    }
}
