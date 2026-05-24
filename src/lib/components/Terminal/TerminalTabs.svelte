<script lang="ts">
  import { onMount } from 'svelte';
  import Terminal from './Terminal.svelte';
  import { terminalManager } from '$lib/terminal/TerminalManager';
  import type { SessionInfo } from '$lib/terminal/types';

  let { activeSessionId = $bindable(null), sessions = $bindable([]) } = $props();

  onMount(async () => {
    try {
      sessions = await terminalManager.listSessions();
      
      if (sessions.length === 0) {
        await createNewSession();
      } else if (!activeSessionId) {
        activeSessionId = sessions[0].id;
      }
    } catch (error) {
      console.error('Failed to initialize terminal:', error);
    }
  });

  async function createNewSession() {
    try {
      const sessionId = await terminalManager.createSession({
        cwd: '~',
        cols: 80,
        rows: 24,
      });
      
      sessions = await terminalManager.listSessions();
      activeSessionId = sessionId;
    } catch (error) {
      console.error('Failed to create terminal session:', error);
    }
  }

  async function closeSession(id: string, event: MouseEvent) {
    event.stopPropagation();
    await terminalManager.closeSession(id);
    sessions = sessions.filter(s => s.id !== id);
    
    if (activeSessionId === id) {
      activeSessionId = sessions.length > 0 ? sessions[0].id : null;
      
      if (!activeSessionId) {
        await createNewSession();
      }
    }
  }

  function selectSession(id: string) {
    activeSessionId = id;
  }

  function getSessionName(session: SessionInfo): string {
    const parts = session.cwd.split('/');
    return parts[parts.length - 1] || 'terminal';
  }
</script>

<div class="flex flex-col h-full">
  <!-- Terminal Tabs Bar -->
  <div class="flex items-center gap-1 px-2 py-1 bg-surface-container/50 border-b border-glass shrink-0">
    {#each sessions as session (session.id)}
      <button
        class="flex items-center gap-2 px-3 py-1.5 rounded-md font-body-sm transition-all {activeSessionId === session.id ? 'bg-white/40 text-primary' : 'text-on-surface-variant hover:bg-white/40'}"
        onclick={() => selectSession(session.id)}
      >
        <span class="material-symbols-outlined text-[14px]">terminal</span>
        <span>{getSessionName(session)}</span>
        <span
          role="button"
          tabindex="0"
          class="ml-1 p-0.5 rounded hover:bg-white/60 transition-colors cursor-pointer"
          onclick={(e) => closeSession(session.id, e)}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeSession(session.id, e as unknown as MouseEvent); }}}
        >
          <span class="material-symbols-outlined text-[12px]">close</span>
        </span>
      </button>
    {/each}

    <button
      class="p-1.5 rounded-md text-on-surface-variant hover:text-primary hover:bg-white/40 transition-all"
      onclick={createNewSession}
      title="New Terminal"
    >
      <span class="material-symbols-outlined text-[16px]">add</span>
    </button>
  </div>

  <!-- Terminal Content -->
  <div class="flex-1 overflow-hidden bg-[#0d0d0d] relative">
    {#if sessions.length === 0}
      <div class="absolute inset-0 flex items-center justify-center text-on-surface-variant">
        <div class="text-center">
          <span class="material-symbols-outlined text-[48px] opacity-50">terminal</span>
          <p class="mt-2 font-body-md">No terminal session</p>
          <button
            class="mt-4 px-4 py-2 rounded-lg bg-primary text-white font-body-sm hover:opacity-90 transition-opacity"
            onclick={createNewSession}
          >
            Create Terminal
          </button>
        </div>
      </div>
    {:else}
      {#each sessions as session (session.id)}
        <div
          class="absolute inset-0 {session.id === activeSessionId ? '' : 'hidden'}"
        >
          <Terminal sessionId={session.id} active={session.id === activeSessionId} />
        </div>
      {/each}
    {/if}
  </div>
</div>
