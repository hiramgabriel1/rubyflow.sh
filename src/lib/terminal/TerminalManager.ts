import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { SessionInfo, CreateTerminalOptions } from './types';

export class TerminalSession {
  public terminal: Terminal;
  public fitAddon: FitAddon;
  public sessionId: string;
  private unlistenData?: UnlistenFn;
  private unlistenExit?: UnlistenFn;

  constructor(sessionId: string, element: HTMLElement) {
    this.sessionId = sessionId;
    
    // Initialize xterm with project styling
    this.terminal = new Terminal({
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 13,
      lineHeight: 1.5,
      theme: {
        background: '#0d0d0d',
        foreground: '#cdd6f4',
        cursor: '#ff5555',
        cursorAccent: '#0d0d0d',
        black: '#0d0d0d',
        red: '#f38ba8',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        blue: '#89b4fa',
        magenta: '#f5c2e7',
        cyan: '#89dceb',
        white: '#cdd6f4',
        brightBlack: '#45475a',
        brightRed: '#f38ba8',
        brightGreen: '#a6e3a1',
        brightYellow: '#f9e2af',
        brightBlue: '#89b4fa',
        brightMagenta: '#f5c2e7',
        brightCyan: '#89dceb',
        brightWhite: '#cdd6f4',
      },
      scrollback: 10000,
      convertEol: true,
      cursorBlink: true,
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.open(element);
    this.fitAddon.fit();

    // Setup input handler
    this.terminal.onData((data) => {
      this.writeToBackend(data);
    });

    // Setup resize handler
    this.terminal.onResize(({ cols, rows }) => {
      this.resizeBackend(cols, rows);
    });

    // Listen for backend data
    this.setupListeners();
  }

  private async setupListeners() {
    // Listen for terminal output
    this.unlistenData = await listen(`terminal://data/${this.sessionId}`, (event) => {
      const data = event.payload as string;
      this.terminal.write(data);
    });

    // Listen for terminal exit
    this.unlistenExit = await listen(`terminal://exit/${this.sessionId}`, () => {
      this.terminal.writeln('\r\n\x1b[31m[Process exited]\x1b[0m');
    });
  }

  private async writeToBackend(data: string) {
    try {
      await invoke('terminal_write', {
        id: this.sessionId,
        data,
      });
    } catch (error) {
      console.error('Failed to write to terminal:', error);
    }
  }

  private async resizeBackend(cols: number, rows: number) {
    try {
      await invoke('terminal_resize', {
        id: this.sessionId,
        cols,
        rows,
      });
    } catch (error) {
      console.error('Failed to resize terminal:', error);
    }
  }

  public focus() {
    this.terminal.focus();
  }

  public fit() {
    try {
      this.fitAddon.fit();
    } catch (e) {
      // Silently ignore if element has no dimensions
    }
  }

  public dispose() {
    this.unlistenData?.();
    this.unlistenExit?.();
    this.terminal.dispose();
  }
}

export class TerminalManager {
  private static instance: TerminalManager;
  private sessions: Map<string, TerminalSession> = new Map();

  private constructor() {}

  public static getInstance(): TerminalManager {
    if (!TerminalManager.instance) {
      TerminalManager.instance = new TerminalManager();
    }
    return TerminalManager.instance;
  }

  public async createSession(options: CreateTerminalOptions = {}): Promise<string> {
    const cwd = options.cwd || '~';
    const cols = options.cols || 80;
    const rows = options.rows || 24;

    const sessionId = await invoke('terminal_create', { cwd, cols, rows });
    return sessionId as string;
  }

  public async attachSession(sessionId: string, element: HTMLElement): Promise<TerminalSession> {
    // Always create new xterm instance — xterm.js cannot be moved between elements
    // Clean up old frontend session if it exists
    const existing = this.sessions.get(sessionId);
    if (existing) {
      existing.dispose();
    }

    const session = new TerminalSession(sessionId, element);
    this.sessions.set(sessionId, session);
    return session;
  }

  public getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  public async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.dispose();
      this.sessions.delete(sessionId);
    }

    try {
      await invoke('terminal_close', { id: sessionId });
    } catch (error) {
      console.error('Failed to close terminal:', error);
    }
  }

  public async listSessions(): Promise<SessionInfo[]> {
    try {
      const sessions = await invoke('terminal_list');
      return sessions as SessionInfo[];
    } catch (error) {
      console.error('Failed to list sessions:', error);
      return [];
    }
  }

  public disposeAll(): void {
    for (const [id, session] of this.sessions.entries()) {
      session.dispose();
    }
    this.sessions.clear();
  }
}

// Export singleton instance
export const terminalManager = TerminalManager.getInstance();
