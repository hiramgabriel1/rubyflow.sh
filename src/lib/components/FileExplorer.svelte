<script lang="ts">
  import type { FileExplorerStore } from '$lib/stores/fileExplorer.svelte';

  interface Props {
    store: FileExplorerStore;
  }

  let { store }: Props = $props();

  let expandedDirs = $state<Set<string>>(new Set());

  function toggleDir(path: string) {
    if (expandedDirs.has(path)) {
      expandedDirs.delete(path);
    } else {
      expandedDirs.add(path);
    }
    expandedDirs = new Set(expandedDirs);
  }

  function getFileIcon(entry: { name: string; is_dir: boolean }): string {
    if (entry.is_dir) return 'folder';
    const ext = entry.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'svelte': return 'code_blocks';
      case 'ts': case 'js': case 'mjs': return 'javascript';
      case 'rs': return 'code';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'data_object';
      case 'md': return 'markdown';
      default: return 'description';
    }
  }

  function getFileColor(entry: { name: string; is_dir: boolean }): string {
    if (entry.is_dir) return 'text-blue-400';
    const ext = entry.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'svelte': return 'text-orange-400';
      case 'ts': case 'js': case 'mjs': return 'text-yellow-500';
      case 'rs': return 'text-orange-600';
      case 'css': return 'text-blue-400';
      case 'html': return 'text-red-400';
      case 'json': return 'text-yellow-600';
      case 'md': return 'text-green-600';
      default: return 'text-gray-400';
    }
  }

  function handleEntryClick(entry: { name: string; path: string; is_dir: boolean; is_file: boolean }) {
    if (entry.is_dir) {
      store.loadDirectory(entry.path);
    } else if (entry.is_file) {
      store.openFile(entry.path);
    }
  }

  function getDirName(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  }
</script>

<div class="flex flex-col h-full">
  <!-- Path bar -->
  <div class="flex items-center justify-between p-3 border-b border-glass h-[44px] shrink-0">
    <div class="flex items-center gap-4 text-label-caps text-on-surface-variant font-semibold tracking-wider">
      <button class="text-on-surface hover:text-primary transition-colors">Files</button>
      <button class="hover:text-on-surface transition-colors">Changes</button>
      <button class="hover:text-on-surface transition-colors">Review</button>
    </div>
    <button class="text-on-surface-variant hover:text-primary transition-colors" onclick={() => store.loadCwd()}>
      <span class="material-symbols-outlined text-[18px]">home</span>
    </button>
  </div>

  <!-- Current path breadcrumb -->
  <div class="flex items-center gap-1 px-3 py-1.5 border-b border-glass shrink-0 overflow-x-auto">
    <button
      class="text-on-surface-variant hover:text-primary transition-colors shrink-0"
      onclick={() => store.goUp()}
      title="Go up"
    >
      <span class="material-symbols-outlined text-[16px]">arrow_upward</span>
    </button>
    <span class="text-on-surface-variant text-[10px] mx-1">/</span>
    <span class="font-code-sm text-[11px] text-on-surface-variant truncate">{store.currentPath || '...'}</span>
  </div>

  <!-- Explorer label -->
  <div class="flex items-center justify-between px-4 py-2 mt-1 shrink-0">
    <span class="font-label-caps text-on-surface-variant tracking-wider text-[10px]">EXPLORER</span>
    <div class="flex items-center gap-2 text-on-surface-variant">
      <button class="hover:text-primary transition-colors"><span class="material-symbols-outlined text-[16px]">sync</span></button>
    </div>
  </div>

  <!-- File list -->
  <div class="flex-1 overflow-y-auto p-2 font-code-sm text-on-surface-variant">
    {#if store.isLoading && store.entries.length === 0}
      <div class="flex items-center justify-center py-8">
        <span class="material-symbols-outlined animate-spin text-[20px]">refresh</span>
      </div>
    {:else if store.error}
      <div class="px-3 py-2 text-error text-[12px]">{store.error}</div>
    {:else if store.entries.length === 0}
      <div class="px-3 py-2 text-on-surface-variant text-[12px]">Empty folder</div>
    {:else}
      {#each store.entries as entry}
        <div
          class="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-container-high cursor-pointer transition-colors {store.selectedFile === entry.path ? 'bg-primary/10 text-primary border border-primary/20' : ''}"
          onclick={() => handleEntryClick(entry)}
        >
          {#if entry.is_dir}
            <span class="material-symbols-outlined text-[14px] text-transparent">chevron_right</span>
          {:else}
            <span class="material-symbols-outlined text-[14px] text-transparent">chevron_right</span>
          {/if}
          <span class="material-symbols-outlined text-[14px] {getFileColor(entry)} {store.selectedFile === entry.path ? 'font-medium' : ''}">{getFileIcon(entry)}</span>
          <span class="truncate text-[12px] {store.selectedFile === entry.path ? 'font-medium' : ''}">{entry.name}</span>
        </div>
      {/each}
    {/if}
  </div>
</div>
