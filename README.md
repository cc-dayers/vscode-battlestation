# Battlestation

A powerful VS Code extension that provides a configurable command launcher panel and integrated todo management system. Execute commands, npm scripts, VS Code tasks, and launch configurations with a single click, while managing your project tasks in a dedicated todos panel.

## Features

### 🚀 Command Launcher
- **Quick Command Access**: Execute any command type with a single click
- **Auto-Configuration**: Automatically detect npm scripts, VS Code tasks, and launch configurations
- **Custom Icons**: Use [VS Code codicons](https://microsoft.github.io/vscode-codicons/dist/codicon.html) or emoji for visual organization
- **Group Management**: Organize commands into collapsible groups with custom colors and icons
- **Smart Search**: Filter commands by name, type, or group
- **Flexible Display**: Toggle visibility of icons, command types, and command metadata
- **Hide Actions**: Temporarily hide actions without deleting them
- **Progressive Disclosure**: UI adapts based on your configuration

### ✅ Todo Management (⚠️ Experimental)
- **Integrated Todos Panel**: Manage project tasks directly in the sidebar
- **Priority Levels**: High, medium, and low priority tasks
- **Detailed Notes**: Add detailed descriptions to each todo
- **Completion Tracking**: Check off completed tasks
- **Reorderable**: Drag and drop todos to reorganize
- **CRUD Operations**: Create, edit, and delete todos easily
- **Enable in Settings**: Set `battlestation.experimental.enableTodos` to `true`

### 🎨 Customization
- **Custom Icon Mappings**: Define your own icon mappings for command types
- **Flexible Configuration**: JSON-based configuration with auto-generation
- **Per-Workspace Settings**: Each workspace can have its own battle.config

### ⚡ User Experience
- **Loading Indicators**: Progress feedback during config generation, tool detection, and file operations
- **Non-Intrusive Progress**: Loading states appear in the view header without blocking the UI
- **Instant Feedback**: All async operations provide clear progress messages
- **Reliable View State**: Views properly refresh when reopened or made visible

## Getting Started

1. Install the extension
2. Open a workspace folder
3. Click the **Battlestation** icon in the Activity Bar (rocket icon)
4. Create your first `battle.config` file:
   - **Option A**: Click "Generate Config" to automatically detect npm scripts, tasks, and launch configs
   - **Option B**: Manually create a `battle.config` file in your workspace root

### Enabling Experimental Todos (\u26a0\ufe0f Optional)

The Todos feature is currently experimental and disabled by default. To enable it:

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "Battlestation Experimental"
3. Enable **"Battlestation: Experimental: Enable Todos"**
4. Reload VS Code
5. The Todos view will now appear in the Battlestation sidebar

## Configuration

### battle.config

Battlestation uses a `battle.config` file in your workspace root:

```json
{
  "actions": [
    {
      "name": "Build Project",
      "command": "npm run build",
      "type": "npm"
    },
    {
      "name": "Run Tests",
      "command": "npm test",
      "type": "npm",
      "group": "Testing"
    },
    {
      "name": "Start Dev Server",
      "command": "npm start",
      "type": "npm",
      "group": "Development"
    }
  ],
  "groups": [
    {
      "name": "Testing",
      "icon": "beaker",
      "color": "#4CAF50"
    },
    {
      "name": "Development",
      "icon": "code",
      "color": "#2196F3"
    }
  ],
  "icons": [
    { "type": "npm", "icon": "package" },
    { "type": "shell", "icon": "terminal" },
    { "type": "docker", "icon": "file" }
  ]
}
```

### Action Properties

- `name` (required): Display name for the action
- `command` (required): Command to execute
- `type` (required): Command type (npm, shell, vscode, task, launch, or custom)
- `group` (optional): Group name to organize actions
- `hidden` (optional): Hide action from view without deleting
- `workspace` (optional): Workspace identifier for multi-root workspaces

### Group Properties

- `name` (required): Group name
- `icon` (optional): Codicon name for the group
- `color` (optional): Hex color code for the group header

### Icon Mapping Properties

- `type` (required): Command type to map
- `icon` (required): Codicon name or emoji

## Command Types

- **npm**: Run npm scripts (e.g., `npm run build`, `npm test`)
- **shell**: Execute shell commands (e.g., `echo "Hello"`)
- **vscode**: Run VS Code commands (e.g., `workbench.action.toggleSidebarVisibility`)
- **task**: Execute VS Code tasks defined in tasks.json
- **launch**: Start debug configurations from launch.json
- **Custom**: Define your own types with custom icons (e.g., `docker`, `python`, `go`)

## VS Code Settings

Customize Battlestation through VS Code settings (`File > Preferences > Settings` or `Ctrl+,`):

- **`battlestation.display.showIcon`** (default: `true`): Show icons next to action names
- **`battlestation.display.showType`** (default: `true`): Show command type in metadata (e.g., 'npm', 'shell')
- **`battlestation.display.showCommand`** (default: `true`): Show the actual command in metadata
- **`battlestation.display.showGroup`** (default: `true`): Show group headers when items are grouped
- **`battlestation.display.hideIcon`** (default: `"eye-closed"`): Icon to use for hiding items
  - Options: `eye-closed`, `x`, `trash`, `close`, `circle-slash`
- **`battlestation.customIconMappings`** (default: `{}`): Custom icon mappings for command types
  - Example: `{"mytype": "rocket", "deploy": "cloud-upload"}`
- **`battlestation.experimental.enableTodos`** (default: `false`): ⚠️ **EXPERIMENTAL** - Enable the integrated Todos panel

## Available Commands

Access these via Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

- **Battlestation: Open Panel** - Open the main Battlestation panel
- **Battlestation: Open Todos** - Open the Todos panel
- **Battlestation: Refresh** - Refresh the current view
- **Battlestation: Settings** - Open settings configuration
- **Battlestation: Add Action** - Add a new action
- **Battlestation: Add Group** - Add a new group

## Usage Tips

### Quick Start with Auto-Generation
1. Open the Battlestation panel
2. Click "Generate Config"
3. Select which sources to import (npm scripts, tasks, launch configs)
4. Choose whether to enable grouping
5. Edit the generated config as needed

### Organizing with Groups
- Create groups to organize related actions
- Use colors and icons to make groups visually distinct
- Groups are collapsible for better organization

### Managing Todos
- Click the "Todos" view in the Battlestation sidebar
- Use priority levels to organize tasks by importance
- Add detailed descriptions for complex tasks
- Drag and drop to reorder todos

### Hiding vs. Deleting
- Use the hide feature to temporarily remove actions from view
- Toggle "Show Hidden" to reveal hidden actions
- Hidden actions remain in your config and can be restored

## Development & Packaging

### Prerequisites
```bash
# Install Node.js and npm
# Clone the repository
git clone <your-repo-url>
cd vscode-battlestation
```

### Install Dependencies
```bash
npm install
```

### Build Commands
```bash
# One-time build (includes type checking)
npm run build

# Watch mode for development (rebuilds on file changes)
npm run watch

# Type checking only
npm run check-types

# Lint code
npm run lint
```

### Debugging
1. Open the project in VS Code
2. Press **F5** to launch the Extension Development Host
3. Test your changes in the new VS Code window
4. Check Debug Console for logs and errors

### Packaging
```bash
# Package extension as VSIX file (ready for distribution)
npm run package

# This will create: battlestation-<version>.vsix
```

### Publishing
```bash
# Publish to VS Code Marketplace (requires publisher account)
npm run publish
```

### Installing from VSIX
After packaging, you can install the extension locally:
1. Open VS Code
2. Go to Extensions view (`Ctrl+Shift+X`)
3. Click "..." menu → "Install from VSIX..."
4. Select your `.vsix` file

## Architecture

- **extension.ts**: Extension activation and command registration
- **view.ts**: Main Battlestation panel (command launcher)
- **todosView.ts**: Todos panel implementation
- **services/**: Business logic for config and todos management
  - `configService.ts`: Handles battle.config file operations
  - `todosService.ts`: Handles .battle.todos.json operations
- **views/**: UI rendering functions for different views
- **templates/**: Reusable HTML/CSS templates

## Todo Storage

Todos are stored in `.battle.todos.json` in your workspace root. This file is automatically created when you add your first todo.

## License

MIT
