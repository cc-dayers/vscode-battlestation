# Battlestation

A configurable command launcher panel for VS Code. Quickly execute commands, npm scripts, VS Code tasks, and launch configurations from a convenient sidebar panel.

## Features

- **Quick Command Access**: Execute commands with a single click
- **Auto-Configuration**: Automatically detect npm scripts, tasks, and launch configs
- **Custom Icons**: Choose from codicons or use emoji for visual organization
- **Group Management**: Organize commands into custom groups
- **Smart Search**: Filter commands by name, type, or group
- **Flexible Display**: Toggle visibility of icons, command types, and metadata
- **Progressive Disclosure**: Only show features when they're relevant

## Getting Started

1. Install the extension
2. Open a workspace folder
3. Click the Battlestation icon in the Activity Bar
4. Create your first `battle.config` file:
   - Automatically generate from existing npm/tasks/launch configs
   - Or manually create your own

## Configuration

Battlestation uses a `battle.config` file in your workspace root:

```json
{
  "items": [
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
    }
  ],
  "groups": [
    {
      "name": "Testing",
      "icon": "beaker"
    }
  ],
  "icons": [
    { "type": "npm", "icon": "package" },
    { "type": "shell", "icon": "terminal" }
  ]
}
```

## Command Types

- **npm**: Run npm scripts
- **shell**: Execute shell commands
- **vscode**: Run VS Code commands
- **task**: Execute VS Code tasks
- **launch**: Start debug configurations
- **Custom**: Define your own types with custom icons

## Settings

Customize Battlestation through VS Code settings:

- `battlestation.display.showIcon`: Show icons next to button names
- `battlestation.display.showType`: Show command type in metadata
- `battlestation.display.showCommand`: Show the actual command
- `battlestation.display.showGroup`: Show group headers
- `battlestation.display.hideIcon`: Icon to use for hiding items
- `battlestation.customIconMappings`: Custom icon mappings for command types

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run watch

# Debug in VS Code
Press F5 to launch Extension Development Host
```

## License

MIT
