<script lang="ts">
  import type { FileExplorerStore } from '$lib/stores/fileExplorer.svelte';

  interface Props {
    store: FileExplorerStore;
  }

  let { store }: Props = $props();

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    store.setContent(target.value);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      store.saveFile();
    }
  }

  function getFileName(path: string | null): string {
    if (!path) return 'Untitled';
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  }

  function getLanguage(path: string | null): string {
    if (!path) return 'text';
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': return 'typescript';
      case 'js': case 'mjs': return 'javascript';
      case 'svelte': return 'svelte';
      case 'rs': return 'rust';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'text';
    }
  }
</script>

<div class="flex flex-col h-full bg-[#0d0d0d]">
  {#if store.selectedFile}
    <!-- File tab bar -->
    <div class="flex items-center gap-1 px-3 py-1.5 bg-surface-container/50 border-b border-glass shrink-0">
      <div class="flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 font-body-sm text-[12px]">
        <span class="material-symbols-outlined text-[14px]">description</span>
        <span class="truncate max-w-[200px]">{getFileName(store.selectedFile)}</span>
        {#if store.isDirty}
          <span class="w-1.5 h-1.5 rounded-full bg-[#f9e2af]"></span>
        {/if}
      </div>
      <div class="flex-1"></div>
      <button
        class="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-body-sm text-on-surface-variant hover:text-primary hover:bg-white/40 transition-all"
        onclick={() => store.saveFile()}
      >
        <span class="material-symbols-outlined text-[14px]">save</span>
        Save
      </button>
    </div>

    <!-- Editor area -->
    <div class="flex-1 relative">
      <textarea
        class="w-full h-full bg-[#0d0d0d] text-[#cdd6f4] font-code-sm text-[13px] leading-[20px] p-4 resize-none outline-none border-none"
        style="font-family: 'JetBrains Mono', monospace;"
        spellcheck="false"
        value={store.fileContent}
        oninput={handleInput}
        onkeydown={handleKeyDown}
      ></textarea>
    </div>
  {:else}
    <!-- Empty state -->
    <div class="flex-1 flex items-center justify-center text-on-surface-variant">
      <div class="text-center">
        <span class="material-symbols-outlined text-[48px] opacity-50">description</span>
        <p class="mt-2 font-body-md">No file open</p>
        <p class="mt-1 text-[12px] opacity-50">Select a file from the explorer</p>
      </div>
    </div>
  {/if}
</div>
