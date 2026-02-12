# Release Process

This document describes the automated release process for Battlestation.

## 🚀 Quick Release (Recommended)

**For a patch release (0.0.2 → 0.0.3):**

```bash
# 1. Bump version in package.json
npm run release:patch

# 2. Commit and tag
npm run release:tag
```

That's it! GitHub Actions will:
- ✅ Build the extension
- ✅ Package the VSIX
- ✅ Create a GitHub Release
- ✅ Upload the VSIX file
- ✅ Generate release notes

## 📋 Manual Steps Explained

### Step 1: Version Bump

```bash
# Patch: 0.0.2 → 0.0.3 (bug fixes)
npm run release:patch

# Minor: 0.0.2 → 0.1.0 (new features)
npm run release:minor

# Major: 0.0.2 → 1.0.0 (breaking changes)
npm run release:major
```

This runs a build and updates `package.json` version (no git commit yet).

### Step 2: Commit, Tag, and Push

```bash
npm run release:tag
```

This will:
1. Stage `package.json`
2. Commit with message: `chore: bump version to vX.Y.Z`
3. Create git tag `vX.Y.Z`
4. Push commit and tag to GitHub

### Step 3: Automated Build (GitHub Actions)

Once the tag is pushed, GitHub Actions automatically:

1. **Checkout** the tagged commit
2. **Install** dependencies with `npm ci`
3. **Build** extension with `npm run build`
4. **Package** VSIX with `npm run package`
5. **Verify** VSIX filename matches version
6. **Create Release** on GitHub
7. **Upload** VSIX file as asset
8. **Generate** release notes from commits

## 🎯 Workflow File

The automation is defined in `.github/workflows/release.yml`

**Trigger:** Push to any tag matching `v*.*.*` pattern

**Permissions:** Requires `contents: write` to create releases

**Environment:** Runs on Ubuntu with Node.js 20

## 🔧 Alternative: Manual Release

If you need to release manually (e.g., GitHub Actions is down):

```bash
# 1. Update version
npm run release:patch

# 2. Build and package
npm run package

# 3. Commit and tag manually
git add package.json
git commit -m "chore: bump version to vX.Y.Z"
git tag vX.Y.Z
git push && git push --tags

# 4. Create release manually at:
# https://github.com/cc-dayers/vscode-battlestation/releases/new
```

## ✅ Version Consistency Checklist

The process ensures these always match:
- ✅ `package.json` version field
- ✅ Git tag name (`vX.Y.Z`)
- ✅ VSIX filename (`battlestation-X.Y.Z.vsix`)
- ✅ GitHub Release title

## 🐛 Troubleshooting

**Problem: "VSIX file not found" in GitHub Actions**

- Check that `npm run package` succeeds locally
- Verify VSIX filename matches package.json version
- Ensure vsce is installed in devDependencies

**Problem: Release not created**

- Verify GitHub token has `contents: write` permission
- Check Actions tab for workflow failures
- Ensure tag follows `v*.*.*` pattern (e.g., `v0.0.3`)

**Problem: Version mismatch**

- Always use `npm run release:*` scripts
- Don't manually edit package.json version
- If mismatch occurs, delete the tag and start over:
  ```bash
  git tag -d vX.Y.Z
  git push --delete origin vX.Y.Z
  ```

## 📦 Publishing to Marketplace

To publish to VS Code Marketplace (future):

```bash
# Get publisher access token from:
# https://dev.azure.com/cc-dayers/_usersSettings/tokens

# Login once
vsce login cc-dayers

# Then publish
npm run publish
```

This can also be automated in GitHub Actions with the token stored as a secret.

## 🎉 Summary

**One-liner for most releases:**

```bash
npm run release:patch && npm run release:tag
```

Then watch GitHub Actions do the rest! 🚀
