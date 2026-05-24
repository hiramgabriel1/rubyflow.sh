export interface SessionInfo {
  id: string;
  cwd: string;
  cols: number;
  rows: number;
}

export interface TerminalEvent {
  sessionId: string;
  data: string;
}

export interface CreateTerminalOptions {
  cwd?: string;
  cols?: number;
  rows?: number;
}
