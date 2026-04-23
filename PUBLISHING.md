# Publishing Battlestation to the VS Code Marketplace

## Prerequisites

Your `package.json` already has the correct publisher ID (`cc-dayers`) and `vsce` is installed as a dev dependency. Before publishing you need:

1. A **Microsoft account** with a registered publisher on the marketplace
2. A **Personal Access Token (PAT)** scoped to marketplace management
3. `vsce` authenticated locally

---

## Step 1 — Create a Publisher Account

1. Go to [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage) and sign in with a Microsoft account
2. Create a new publisher with the ID **`cc-dayers`** — this must match the `"publisher"` field in `package.json`

---

## Step 2 — Create a Personal Access Token

1. Go to [dev.azure.com](https://dev.azure.com) → click your profile avatar → **Personal Access Tokens**
2. Create a new token:
   - **Organization**: All accessible organizations
   - **Scopes**: Marketplace → **Manage**
3. Copy the token — it won't be shown again

---

## Step 3 — Authenticate vsce

```bash
npx vsce login cc-dayers
# Paste your PAT when prompted
```

---

## Step 4 — Pre-Publish Checklist

Before the first publish, review these items:

| Item | Status | Notes |
|---|---|---|
| `media/icon.svg` | ✅ exists | Used as the marketplace listing icon |
| `README.md` | ✅ exists | Becomes the marketplace listing page |
| `"description"` in package.json | ⚠️ stale | Still says "driven by battle.json" — update to reflect `battle.config` |
| `"categories"` in package.json | ⚠️ minimal | Currently just `["Other"]` — consider adding `"Productivity"` or `"Visualization"` |
| `"keywords"` in package.json | ❌ missing | Add for search discoverability, e.g. `["command launcher", "task runner", "productivity", "scripts"]` |

---

## Step 5 — Publish

```bash
npm run publish
```

This runs `npm run build` first (via the `vscode:prepublish` hook), then uploads to the marketplace. The first publish creates the listing; subsequent runs push updates.

## VS Code Task Release Flow

If you want one local entry point for the full GitHub-release flow, run the VS Code task:

- `Tasks: Run Task` -> `Release: Version, tag, and publish VSIX`

That task prompts for `patch`, `minor`, or `major`, then runs:

```bash
npm run test:ui
npm run test:unit
npm run build
npm run release:<patch|minor|major>
npm run release:tag
```

The final tag push triggers `.github/workflows/release.yml`, which reruns the release gates in GitHub Actions, packages the extension, and attaches the generated `.vsix` file to the GitHub release.

---

## Releasing Updates

Use the existing release scripts to bump the version, then publish:

```bash
npm run release:patch   # 0.6.x → 0.6.x+1
npm run release:minor   # 0.6.x → 0.7.0
npm run release:major   # 0.x.x → 1.0.0
npm run release:tag     # Creates git tag for the release
npm run publish         # Build and upload to marketplace
```

---

## Local .vsix Distribution (Alternative)

To share the extension without publishing to the marketplace:

```bash
npm run package   # Creates battlestation-<version>.vsix
```

Users install it via:
- VS Code: `Extensions` sidebar → `...` menu → `Install from VSIX...`
- CLI: `code --install-extension battlestation-<version>.vsix`
