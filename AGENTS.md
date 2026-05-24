# AGENTS.md

## Stack
- **Tauri 2** (Rust backend) + **SvelteKit 2** + **Svelte 5** + **TypeScript** + **Vite 6**
- **pnpm** for package management
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- SPA mode (no SSR): `export const ssr = false` in `src/routes/+layout.ts`

## Commands
```bash
pnpm install              # Install dependencies
pnpm tauri dev            # Run Tauri dev (starts Vite on port 1420)
pnpm tauri build          # Build for production
pnpm check                # Type-check (runs svelte-kit sync first)
```

## Architecture
- **Frontend**: `src/` - SvelteKit routes and components
- **Backend**: `src-tauri/` - Rust Tauri app
  - Entry: `src-tauri/src/main.rs` → calls `hasper_app_lib::run()` in `lib.rs`
  - Config: `src-tauri/tauri.conf.json` (dev port: 1420, window: 1280x800, frameless/transparent)
- **Build output**: `build/` (frontend dist for Tauri)

## Key Conventions
- Svelte 5 runes syntax (`$state`, `$effect`)
- Custom design system in `src/app.css` with CSS custom properties (no Tailwind config needed for colors)
- `.svelte-kit/` is auto-generated; do not edit
- Vite config has Tauri-specific settings: strict port 1420, ignores `src-tauri/` in watch

## Testing
- No test framework configured yet
