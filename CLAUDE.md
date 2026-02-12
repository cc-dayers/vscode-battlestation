# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

### Setup
```bash
npm install  # Install dependencies
```

### Development
```bash
npm run build        # One-time production build (includes type checking and codicon copying)
npm run watch        # Watch mode - rebuilds on file changes (development)
npm run check-types  # Type checking only (no build)
npm run lint         # Lint TypeScript code
```

### Debugging
- Press **F5** in VS Code to launch Extension Development Host
- The launch configuration automatically runs `npm run watch` as a pre-launch task
- Debug output appears in the Debug Console of the main VS Code window
- Test changes in the Extension Development Host window

### Packaging and Publishing
```bash
npm run package  # Create .vsix file for distribution
npm run publish  # Publish to VS Code Marketplace (requires publisher credentials)
```

## Architecture Overview

### High-Level Structure
This is a VS Code extension that provides two webview-based panels:
1. **Battlestation Panel**: A configurable command launcher with action buttons
2. **Todos Panel**: An experimental task management system (opt-in feature)

### Key Architectural Decisions

**Async File Operations**
- Uses `vscode.workspace.fs` instead of Node's `fs` module for all file operations
- This ensures compatibility with remote workspaces and VS Code for Web
- All config and todos operations are async

**Config File Location**
- New location: `.battle/battle.config` (preferred)
- Legacy location: `battle.config` (root directory)
- ConfigService automatically migrates from legacy to new location
- File watching monitors both locations for changes

**Todos Storage**
- Stored in `.battle.todos.json` in workspace root
- Created automatically when first todo is added

**Build System**
- Uses esbuild for fast bundling
- Custom esbuild plugin (`cssTextLoaderPlugin`) loads codicon.css as a text string for webview embedding
- Build script copies codicon fonts from `node_modules/@vscode/codicons` to `media/`
- TypeScript compiles to CommonJS format targeting ES2020

### Directory Structure

```
src/
├── extension.ts              # Extension entry point, command registration, activation
├── view.ts                   # Main Battlestation panel (command launcher)
├── todosView.ts             # Todos panel implementation
├── types.ts                 # Shared TypeScript interfaces
├── services/
│   ├── configService.ts     # battle.config file operations, scanning, caching
│   └── todosService.ts      # .battle.todos.json operations
├── views/                   # UI rendering functions (returns HTML strings)
│   ├── index.ts            # Exports all view renderers
│   ├── mainView.ts         # Main command launcher UI
│   ├── settingsView.ts     # Settings configuration UI
│   ├── loadingView.ts      # Loading state UI
│   ├── generateConfigView.ts  # Config generation wizard
│   ├── addItemForm.ts      # Add action form
│   ├── editItemForm.ts     # Edit action form
│   ├── addGroupForm.ts     # Add group form
│   ├── editGroupForm.ts    # Edit group form
│   └── helpers.ts          # Shared view helpers
└── templates/              # Reusable HTML/CSS components
    ├── layout.ts           # Base HTML layout wrapper
    ├── styles.ts           # Global CSS styles
    └── nonce.ts            # CSP nonce generation
```

### Message Passing Pattern
- Webviews communicate with extension host via `postMessage`
- Extension listens via `webview.onDidReceiveMessage`
- Commands include: `refresh`, `executeAction`, `addAction`, `editAction`, `deleteAction`, `toggleHidden`, `addGroup`, `editGroup`, `deleteGroup`, etc.

### Config Caching Strategy
- ConfigService caches config content based on file modification time (`mtime`)
- Cache invalidated on file changes (via FileSystemWatcher)
- Prevents redundant file reads when config hasn't changed

## Configuration File Structure

### battle.config Schema
```typescript
{
  actions: Action[];      // Required: list of command actions
  groups?: Group[];       // Optional: group definitions
  icons?: IconMapping[];  // Optional: custom icon mappings
}

interface Action {
  name: string;        // Display name
  command: string;     // Command to execute
  type: string;        // Command type (npm, shell, vscode, task, launch, custom)
  group?: string;      // Optional group name
  hidden?: boolean;    // Hide from view without deleting
  workspace?: string;  // Workspace identifier for multi-root workspaces
}

interface Group {
  name: string;    // Group name
  icon?: string;   // Codicon name or emoji
  color?: string;  // Hex color code
}

interface IconMapping {
  type: string;  // Command type
  icon: string;  // Codicon name or emoji
}
```

### Command Types
- **npm**: Executes npm scripts (e.g., `npm run build`)
- **shell**: Runs shell commands in terminal
- **vscode**: Executes VS Code commands (e.g., `workbench.action.toggleSidebarVisibility`)
- **task**: Runs tasks from `.vscode/tasks.json` - format: `workbench.action.tasks.runTask|<taskLabel>`
- **launch**: Starts debug configs from `.vscode/launch.json` - format: `workbench.action.debug.start|<configName>`
- **Custom types**: Any string (e.g., `docker`, `python`) with custom icon mappings

## Auto-Config Generation

ConfigService provides scanning methods:
- `scanNpmScripts()`: Recursively scans workspace for package.json files (skips node_modules, .git, dist, build, out)
- `scanTasks()`: Reads `.vscode/tasks.json` and extracts task labels
- `scanLaunchConfigs()`: Reads `.vscode/launch.json` and extracts configuration names

These are used by the "Generate Config" feature to auto-populate actions from existing workspace configuration.

## VS Code Integration

### Commands Registered
- `battlestation.open`: Open main Battlestation panel
- `battlestation.openTodos`: Open Todos panel
- `battlestation.refresh`: Refresh current view
- `battlestation.addItem`: Show add action form
- `battlestation.addGroup`: Show add group form
- `battlestation.openSettings`: Show settings configuration

### Context Keys
- `battlestation.hasConfig`: Set to true when battle.config exists (used to conditionally show "Add Group" button)

### Configuration Settings
- `battlestation.display.showIcon`: Show icons next to action names
- `battlestation.display.showType`: Show command type in metadata
- `battlestation.display.showCommand`: Show actual command in metadata
- `battlestation.display.showGroup`: Show group headers
- `battlestation.display.hideIcon`: Icon for hide feature (eye-closed, x, trash, close, circle-slash)
- `battlestation.customIconMappings`: Custom icon mappings object
- `battlestation.experimental.enableTodos`: Enable experimental Todos panel

## Important Implementation Details

### JSON Comment Stripping
When reading `.vscode/tasks.json` and `.vscode/launch.json`, ConfigService strips comments using `stripJsonComments()` because these files support JSON with comments (JSONC format).

### Recursive NPM Script Scanning
ConfigService scans up to 10 levels deep for package.json files in subdirectories. This allows detecting monorepo or multi-package setups. Depth limit prevents infinite recursion.

### Multi-Root Workspace Support
Actions track their workspace via the optional `workspace` property. This allows distinguishing commands from different workspace folders in multi-root setups.

### Codicon Integration
- Extension bundles codicon fonts and CSS from `@vscode/codicons` package
- `npm run build` copies these files to `media/` directory
- Webviews load the CSS to render codicons (VS Code's icon font)
- Custom esbuild plugin loads codicon.css as importable text string

### Extension Activation
- Extension activates when VS Code starts (no specific activation events)
- Registers webview providers for both panels
- Todos panel only registers if `battlestation.experimental.enableTodos` is enabled
- ConfigService sets up FileSystemWatcher on activation to detect config changes
