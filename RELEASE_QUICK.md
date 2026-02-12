# 🚀 Quick Release Guide

## When you're ready to release:

### 1. Bump version
```bash
# For bug fixes (0.0.2 → 0.0.3)
npm run release:patch

# For new features (0.0.2 → 0.1.0)
npm run release:minor

# For breaking changes (0.0.2 → 1.0.0)
npm run release:major
```

### 2. Commit, tag, and push
```bash
npm run release:tag
```

### 3. Done! 
GitHub Actions will automatically:
- ✅ Build the extension
- ✅ Package the VSIX
- ✅ Create a GitHub Release
- ✅ Upload the VSIX file
- ✅ Generate release notes

## What just happened?

### `npm run release:patch`
1. Runs `npm run build` (ensures clean build)
2. Updates version in `package.json` (0.0.2 → 0.0.3)
3. Does NOT commit yet (so you can review)

### `npm run release:tag`
1. Stages `package.json`
2. Commits: `chore: bump version to v0.0.3`
3. Creates git tag: `v0.0.3`
4. Pushes commit to GitHub
5. Pushes tag to GitHub

### GitHub Actions (automatic)
1. Triggered by tag push
2. Installs dependencies
3. Builds and packages extension
4. Verifies VSIX filename matches version
5. Creates GitHub Release with generated notes
6. Uploads VSIX as release asset

## No more version mismatches! 🎉

The process ensures these always match:
- ✅ `package.json` version
- ✅ Git tag name
- ✅ VSIX filename
- ✅ GitHub Release title

## See also

- Full documentation: [RELEASE_PROCESS.md](./RELEASE_PROCESS.md)
- GitHub Actions workflow: [.github/workflows/release.yml](.github/workflows/release.yml)
