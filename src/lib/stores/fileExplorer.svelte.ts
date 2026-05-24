import { invoke } from '@tauri-apps/api/core';

export interface DirEntry {
  name: string;
  path: string;
  is_dir: boolean;
  is_file: boolean;
}

export interface FileExplorerState {
  currentPath: string;
  entries: DirEntry[];
  selectedFile: string | null;
  fileContent: string;
  originalContent: string;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
}

export function createFileExplorerState() {
  let currentPath = $state('');
  let entries = $state<DirEntry[]>([]);
  let selectedFile = $state<string | null>(null);
  let fileContent = $state('');
  let originalContent = $state('');
  let isDirty = $state(false);
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  async function loadDirectory(path: string) {
    isLoading = true;
    error = null;
    try {
      const result = await invoke<DirEntry[]>('fs_list_dir', { path });
      entries = result;
      currentPath = path;
    } catch (err) {
      error = String(err);
      console.error('Failed to load directory:', err);
    } finally {
      isLoading = false;
    }
  }

  async function loadCwd() {
    try {
      const cwd = await invoke<string>('fs_get_cwd');
      await loadDirectory(cwd);
    } catch (err) {
      error = String(err);
      console.error('Failed to get cwd:', err);
    }
  }

  async function openFile(path: string) {
    isLoading = true;
    error = null;
    try {
      const content = await invoke<string>('fs_read_file', { path });
      selectedFile = path;
      fileContent = content;
      originalContent = content;
      isDirty = false;
    } catch (err) {
      error = String(err);
      console.error('Failed to read file:', err);
    } finally {
      isLoading = false;
    }
  }

  async function saveFile() {
    if (!selectedFile) return;
    isLoading = true;
    error = null;
    try {
      await invoke('fs_write_file', { path: selectedFile, content: fileContent });
      originalContent = fileContent;
      isDirty = false;
    } catch (err) {
      error = String(err);
      console.error('Failed to write file:', err);
    } finally {
      isLoading = false;
    }
  }

  async function goUp() {
    if (!currentPath) return;
    try {
      const parent = await invoke<string>('fs_get_parent', { path: currentPath });
      await loadDirectory(parent);
    } catch (err) {
      console.error('Failed to go up:', err);
    }
  }

  function setContent(content: string) {
    fileContent = content;
    isDirty = fileContent !== originalContent;
  }

  return {
    get currentPath() { return currentPath; },
    get entries() { return entries; },
    get selectedFile() { return selectedFile; },
    get fileContent() { return fileContent; },
    get isDirty() { return isDirty; },
    get isLoading() { return isLoading; },
    get error() { return error; },
    loadDirectory,
    loadCwd,
    openFile,
    saveFile,
    goUp,
    setContent,
  };
}

export type FileExplorerStore = ReturnType<typeof createFileExplorerState>;
