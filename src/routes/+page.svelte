<script lang="ts">
  import { listen } from "@tauri-apps/api/event";
  import { onMount } from "svelte";
  import "../app.css";
  import TerminalTabs from "$lib/components/Terminal/TerminalTabs.svelte";
  import FileExplorer from "$lib/components/FileExplorer.svelte";
  import Editor from "$lib/components/Editor.svelte";
  import { createFileExplorerState } from "$lib/stores/fileExplorer.svelte";

  console.log('[Hasper] +page.svelte mounting...');

  const fileStore = createFileExplorerState();
  console.log('[Hasper] fileStore created:', fileStore.currentPath);

  let activeAgent = $state("claude");
  let showTerminal = $state(false);

  onMount(async () => {
    try {
      await fileStore.loadCwd();
    } catch (err) {
      console.error('Failed to load CWD:', err);
    }
  });

  function toggleTerminal() {
    showTerminal = !showTerminal;
  }

  $effect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 't' && !e.shiftKey) {
        e.preventDefault();
        toggleTerminal();
      }
      if (e.key === 'Escape' && showTerminal) {
        showTerminal = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const unlisten = listen("tauri://focus", () => {
      console.log("Window focused");
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unlisten.then(fn => fn());
    };
  });
</script>

<div class="h-screen w-screen overflow-hidden flex flex-col text-on-surface font-body-md" style="background-color: #F5F4F8;">
  <header data-tauri-drag-region class="flex items-center justify-between px-4 h-[44px] shrink-0 z-50 glass-panel border-b border-glass sticky top-0 w-full">
    <div class="flex items-center gap-4">
      <div class="mac-traffic-lights -ml-4">
        <div class="traffic-light tl-red"></div>
        <div class="traffic-light tl-yellow"></div>
        <div class="traffic-light tl-green"></div>
      </div>
      <div class="flex items-center gap-2 text-on-surface-variant font-code-sm">
        <span class="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
          <span class="material-symbols-outlined text-[14px]">folder</span>
          main
        </span>
        <span class="material-symbols-outlined text-[14px] opacity-50">chevron_right</span>
        <span class="flex items-center gap-1 text-primary cursor-pointer">
          <span class="material-symbols-outlined text-[14px]">code</span>
          main
        </span>
      </div>
    </div>
    
    <div class="flex items-center justify-center flex-1">
      <div class="flex p-1 rounded-full bg-surface-container-low border border-glass shadow-sm">
        <button 
          class="px-4 py-1.5 rounded-full font-body-sm font-medium shadow-sm transition-all flex items-center gap-2 {activeAgent === 'claude' ? 'bg-white text-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'}"
          onclick={() => activeAgent = "claude"}
        >
          <span class="material-symbols-outlined text-[16px]">smart_toy</span>
          Claude
        </button>
        <button 
          class="px-4 py-1.5 rounded-full font-body-sm font-medium shadow-sm transition-all flex items-center gap-2 {activeAgent === 'codex' ? 'bg-white text-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'}"
          onclick={() => activeAgent = "codex"}
        >
          <span class="material-symbols-outlined text-[16px]">terminal</span>
          Codex
        </button>
        <button 
          class="px-4 py-1.5 rounded-full font-body-sm font-medium shadow-sm transition-all flex items-center gap-2 {activeAgent === 'copilot' ? 'bg-white text-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'}"
          onclick={() => activeAgent = "copilot"}
        >
          <span class="material-symbols-outlined text-[16px]">code_blocks</span>
          Copilot
        </button>
      </div>
    </div>
    
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1 bg-surface-container-low px-3 py-1.5 rounded-md border border-glass cursor-pointer hover:bg-surface-container transition-colors">
        <span class="material-symbols-outlined text-[16px] text-primary">play_arrow</span>
        <span class="font-body-sm text-on-surface-variant">Set Run ⌘G</span>
        <span class="material-symbols-outlined text-[14px] text-on-surface-variant ml-1">expand_more</span>
      </div>
      <button class="text-on-surface-variant hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-[20px]">account_circle</span>
      </button>
      <button class="text-on-surface-variant hover:text-primary transition-colors">
        <span class="material-symbols-outlined text-[20px]">settings</span>
      </button>
    </div>
  </header>

  <div class="flex flex-1 overflow-hidden">
    <nav class="w-[240px] shrink-0 h-full flex flex-col p-4 gap-2 border-r border-glass glass-panel z-40 relative">
      <div class="mb-6 mt-2 px-2 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center font-headline-md text-sm">H</div>
          <span class="font-headline-md text-[14px] text-on-surface truncate">@hiram.dev's Team</span>
        </div>
        <span class="material-symbols-outlined text-[16px] text-on-surface-variant">unfold_more</span>
      </div>
      
      <div class="flex flex-col gap-1 flex-1">
        <a class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/40 text-primary shadow-sm transition-all duration-200 ease-in-out font-body-md font-medium border border-white/60" href="/" role="button">
          <span class="material-symbols-outlined text-[20px]">folder_open</span>
          Workspaces
        </a>
        <a class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-white/40 hover:text-on-surface transition-all duration-200 ease-in-out font-body-md" href="/" role="button">
          <span class="material-symbols-outlined text-[20px]">bolt</span>
          Automations
        </a>
        <a class="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-white/40 hover:text-on-surface transition-all duration-200 ease-in-out font-body-md" href="/" role="button">
          <span class="material-symbols-outlined text-[20px]">checklist</span>
          Tasks & PRs
        </a>
        
        <div class="my-2 border-t border-glass"></div>
        
        <button class="flex items-center justify-between px-3 py-2 rounded-lg text-on-surface-variant hover:bg-white/40 hover:text-on-surface transition-all duration-200 ease-in-out font-body-md group">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] opacity-70 group-hover:opacity-100">add</span>
            New Workspace
          </div>
          <span class="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">create_new_folder</span>
        </button>
        
        <div class="mt-4 flex flex-col gap-1">
          <div class="flex items-center justify-between px-3 py-1.5 text-label-caps text-on-surface-variant opacity-70">
            RECENT
          </div>
          <a class="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container text-on-surface shadow-sm font-body-sm border border-glass" href="/" role="button">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">laptop_mac</span>
              main
            </div>
            <span class="text-[10px] bg-white/50 px-1.5 rounded-full text-on-surface-variant">1</span>
          </a>
        </div>
      </div>
      
      <div class="mt-auto border-t border-glass pt-2">
        <a class="flex items-center justify-between px-3 py-2 rounded-lg text-on-surface-variant hover:bg-white/40 hover:text-on-surface transition-all duration-200 ease-in-out font-body-md" href="/" role="button">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px]">settings</span>
            Settings
          </div>
          <span class="material-symbols-outlined text-[16px]">help</span>
        </a>
      </div>
    </nav>

    <main class="flex-1 flex relative bg-white/30">
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="flex items-center gap-2 px-4 py-2 border-b border-glass bg-surface-container/50">
          <button 
            class="px-3 py-1.5 rounded-md font-body-sm transition-all flex items-center gap-2 {showTerminal ? 'text-primary bg-white/40' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/40'}"
            onclick={() => showTerminal = !showTerminal}
          >
            <span class="material-symbols-outlined text-[16px]">terminal</span>
            Terminal
          </button>
          <button 
            class="px-3 py-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-white/40 font-body-sm transition-all flex items-center gap-2"
            onclick={() => showTerminal = false}
          >
            <span class="material-symbols-outlined text-[16px]">smart_toy</span>
            Claude
          </button>
        </div>
        
        {#if showTerminal}
          <div class="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d]">
            <TerminalTabs />
          </div>
        {:else}
          <div class="flex-1 flex flex-col overflow-hidden">
            <Editor store={fileStore} />
          </div>
        {/if}
      </div>

      <aside class="w-[280px] shrink-0 border-l border-glass glass-panel flex flex-col h-full bg-white/40">
        <FileExplorer store={fileStore} />
      </aside>
    </main>
  </div>
</div>

<style>
  :global(.mac-traffic-lights) {
    display: flex;
    gap: 8px;
    padding: 0 16px;
    align-items: center;
  }
  
  :global(.traffic-light) {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  
  :global(.tl-red) { background-color: #FF5F56; border: 1px solid #E0443E; }
  :global(.tl-yellow) { background-color: #FFBD2E; border: 1px solid #DEA123; }
  :global(.tl-green) { background-color: #27C93F; border: 1px solid #1AAB29; }
  
  :global(.glass-panel) {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.75);
  }
  
  :global(::-webkit-scrollbar) {
    width: 6px;
    height: 6px;
  }
  :global(::-webkit-scrollbar-track) {
    background: transparent;
  }
  :global(::-webkit-scrollbar-thumb) {
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
  }
  :global(::-webkit-scrollbar-thumb:hover) {
    background: rgba(0,0,0,0.2);
  }
  
  :global([data-tauri-drag-region]) {
    cursor: default;
    user-select: none;
  }
</style>
