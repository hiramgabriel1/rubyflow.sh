# Hasper Orchestrator

## Descripción

Hasper Orchestrator es una aplicación de escritorio para macOS que funciona como un orquestador de agentes de IA. Proporciona una interfaz unificada para interactuar con múltiples agentes (Claude, Codex, Copilot) e incluye una terminal integrada para ejecutar comandos del sistema.

## Stack Tecnológico

### Frontend
- **SvelteKit 2** + **Svelte 5** - Framework reactivo moderno
- **TypeScript** - Tipado estático
- **Vite 6** - Build tool y dev server
- **Tailwind CSS v4** - Estilos utilitarios (vía `@tailwindcss/postcss`)

### Backend
- **Tauri 2** - Framework para apps de escritorio con Rust
- **Rust** - Backend nativo de alto rendimiento
- **tauri-plugin-shell** - Ejecución de comandos del sistema

### Diseño
- **Custom Design System** - Paleta de colores personalizada en CSS
- **Material Symbols** - Iconos de Google
- **Inter & JetBrains Mono** - Tipografías

## Arquitectura del Proyecto

```
hasper-app/
├── src/                          # Frontend (SvelteKit)
│   ├── app.css                   # Design system y estilos globales
│   ├── app.html                  # HTML template
│   └── routes/
│       ├── +layout.ts            # Config SPA (ssr: false)
│       └── +page.svelte          # Componente principal
├── src-tauri/                    # Backend (Rust/Tauri)
│   ├── src/
│   │   ├── lib.rs                # Lógica principal de Tauri
│   │   └── main.rs               # Punto de entrada
│   ├── capabilities/
│   │   └── default.json          # Permisos de seguridad
│   ├── Cargo.toml                # Dependencias de Rust
│   └── tauri.conf.json           # Configuración de Tauri
├── package.json                  # Dependencias de Node
├── tailwind.config.js            # Configuración de Tailwind
├── postcss.config.js             # Configuración de PostCSS
└── vite.config.js                # Configuración de Vite
```

## Características Principales

### 1. Terminal Integrada
- **Ejecución real de comandos** usando `@tauri-apps/plugin-shell`
- **Prompt estilo powerline** con información de:
  - Usuario y host
  - Directorio actual
  - Rama de Git
  - Versión de Node.js
  - Hora actual
- **Historial de comandos** (↑/↓ para navegar)
- **Soporte de colores ANSI** (tema oscuro)
- **Atajo de teclado**: `Cmd+T` para mostrar/ocultar

### 2. Sistema de Agentes
- **Tabs de agentes**: Claude, Codex, Copilot
- **Interfaz switching** entre diferentes agentes de IA
- **Estado visible** en la parte inferior (Agent Standby/Terminal Active)

### 3. File Explorer
- **Árbol de archivos** con iconos por tipo
- **Carpetas colapsables** con animación
- **Archivo seleccionado** con highlight
- **Acciones rápidas**: crear archivo, carpeta, sync

### 4. Navegación Lateral
- **Workspaces**: Gestión de espacios de trabajo
- **Automations**: Automatizaciones configurables
- **Tasks & PRs**: Seguimiento de tareas
- **Recientes**: Acceso rápido a proyectos

### 5. Quick Actions
- **Open Terminal**: `Cmd+T`
- **Open Chat**: `Cmd+⇧+T`
- **Open Browser**: `Cmd+⇧+B`
- **Search Files**: `Cmd+P`

## Diseño Visual

### Estilo macOS
- **Ventana frameless** con controles de tráfico personalizados
- **Glassmorphism**: Paneles semitransparentes con blur
- **Transiciones suaves** en hover y clicks
- **Decoraciones nativas desactivadas** para control total del diseño

### Paleta de Colores
El proyecto usa un **design system custom** definido en `src/app.css`:

```css
--color-primary: #5f3add        /* Violeta principal */
--color-surface-container: #efecff
--color-on-surface: #1a1a2e
--color-base-bg: #F5F4F8
--color-panel-glass: rgba(255, 255, 255, 0.6)
--color-border-glass: rgba(255, 255, 255, 0.75)
```

### Tipografías
- **Inter**: UI y body text
- **JetBrains Mono**: Código y terminal

## Funcionamiento de la Terminal

### Ejecución de Comandos

```typescript
// En +page.svelte
import { Command } from "@tauri-apps/plugin-shell";

async function executeCommand(cmd: string) {
  const command = Command.create(cmd);
  
  // Escuchar eventos del proceso
  command.on('close', (data) => {
    // Comando completado
  });
  
  command.on('error', (error) => {
    // Manejar error
  });
  
  // Ejecutar y obtener output
  const child = await command.spawn();
  const stdout = await child.getStdout();
}
```

### Parseo de Colores ANSI

```typescript
function parseAnsiToHtml(text: string): string {
  return text
    .replace(/\u001b\[1;32m/g, '<span class="text-[#a6e3a1]">')
    .replace(/\u001b\[0m/g, '</span>')
    .replace(/\n/g, '<br/>');
}
```

### Permisos Requeridos

En `src-tauri/capabilities/default.json`:
```json
{
  "permissions": [
    "core:default",
    "opener:default",
    "shell:default"
  ]
}
```

## Comandos de Desarrollo

```bash
# Instalar dependencias
pnpm install

# Modo desarrollo (Vite + Tauri)
pnpm tauri dev

# Build para producción
pnpm tauri build

# Type checking
pnpm check
```

## Configuración de Tauri

En `src-tauri/tauri.conf.json`:

```json
{
  "app": {
    "macOSPrivateApi": true,    // Necesario para transparencia
    "windows": [{
      "decorations": false,      // Sin barra nativa
      "transparent": true,       // Fondo transparente
      "width": 1280,
      "height": 800
    }]
  },
  "plugins": {
    "shell": {
      "open": true              // Permitir comandos shell
    }
  }
}
```

## Flujo de Datos

1. **Usuario presiona Cmd+T** → Toggle `showTerminal` state
2. **Usuario escribe comando** → Input binding en Svelte
3. **Presiona Enter** → `executeCommand()` llama al plugin shell
4. **Rust ejecuta el comando** → Captura stdout/stderr
5. **Output vuelve al frontend** → Se parsea ANSI y se renderiza
6. **Scroll automático** → Mantiene el view en la última línea

## Seguridad

- **CSP deshabilitada** en desarrollo (configurable para producción)
- **Permisos explícitos** en capabilities
- **Sin SSR** - SPA pura para mayor control
- **Comandos limitados** por configuración del plugin shell

## Dependencias Clave

```json
{
  "@tauri-apps/api": "^2",
  "@tauri-apps/plugin-shell": "^2",
  "@tauri-apps/plugin-opener": "^2",
  "svelte": "^5.0.0",
  "@sveltejs/kit": "^2.9.0",
  "tailwindcss": "^4",
  "@tailwindcss/postcss": "^latest"
}
```

## Próximas Características (Sugeridas)

- [ ] Integración real con APIs de agentes (Claude, etc.)
- [ ] Sistema de archivos real (leer directorios del sistema)
- [ ] Pestañas múltiples en terminal
- [ ] Configuración de temas
- [ ] Persistencia de workspaces
- [ ] Atajos de teclado personalizables
