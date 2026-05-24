<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { terminalManager } from '$lib/terminal/TerminalManager';
  import '@xterm/xterm/css/xterm.css';

  let { sessionId, active = true } = $props();

  let container: HTMLDivElement;
  let initialized = false;

  onMount(async () => {
    if (!container || initialized) return;

    try {
      await terminalManager.attachSession(sessionId, container);
      initialized = true;
    } catch (error) {
      console.error('Failed to attach terminal:', error);
    }
  });

  $effect(() => {
    if (!active || !initialized) return;
    
    const session = terminalManager.getSession(sessionId);
    if (!session) return;
    
    // Use setTimeout to ensure the element is visible before fitting
    const timer = setTimeout(() => {
      session.focus();
      session.fit();
    }, 50);

    return () => clearTimeout(timer);
  });

  onDestroy(() => {
    // Only dispose if the tab is being closed, not when hidden
    // The parent TerminalTabs manages disposal via closeSession
  });
</script>

<div
  bind:this={container}
  class="w-full h-full bg-[#0d0d0d]"
></div>
