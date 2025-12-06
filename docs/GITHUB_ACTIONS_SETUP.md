# GitHub Actions Setup Guide

This guide explains how to set up GitHub Actions to automatically build Windows installers for GTO Poker Bot.

## Prerequisites

1. GitHub repository with the project code
2. GitHub Actions enabled on the repository

## Configuration Steps

### 1. Push Code to GitHub

First, push your code to a GitHub repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/gto-poker-bot.git
git branch -M main
git push -u origin main
```

### 2. Add Required Icons

Before the build can succeed, add icon files to `electron/assets/`:
- `icon.ico` - Windows application icon (256x256)
- `tray-icon.png` - System tray icon (32x32)

See `electron/assets/README.md` for creation instructions.

### 3. Update electron-builder.yml

Edit `electron-builder.yml` and update the publish section:

```yaml
publish:
  provider: github
  owner: YOUR_USERNAME
  repo: gto-poker-bot
  releaseType: draft
```

### 4. Workflow Triggers

The build workflow triggers on:
- Push to `main` or `master` branches
- Pull requests to these branches
- Tags starting with `v` (e.g., `v1.0.0`)
- Manual trigger via GitHub Actions UI

## Creating a Release

### Automatic Release (Recommended)

1. Create and push a version tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

2. GitHub Actions will:
   - Build the Windows installer
   - Build the portable version
   - Create a draft release with both files

3. Go to GitHub Releases and publish the draft

### Manual Release

1. Go to Actions tab in your GitHub repository
2. Select "Build Windows Installer" workflow
3. Click "Run workflow"
4. Check "Create a release" option
5. Click "Run workflow"

## Build Outputs

The workflow produces:
- `GTO-Poker-Bot-Setup-{version}.exe` - NSIS installer
- `GTO-Poker-Bot-{version}-portable.exe` - Portable version

## Troubleshooting

### Build Fails at Native Modules

Native modules like `robotjs` require Visual Studio Build Tools. The workflow handles this automatically, but if issues persist:

1. Check the workflow logs for specific errors
2. Ensure `node-gyp` configuration is correct
3. Verify Python version compatibility

### DXGI Module Build Fails

The DXGI screen capture module is optional. The workflow continues even if it fails (`continue-on-error: true`).

### Missing Icons

If the build fails with missing icon errors:
1. Add icon files to `electron/assets/`
2. Ensure file names match: `icon.ico`, `tray-icon.png`

### Release Not Created

Ensure you've pushed a tag or enabled manual release in the workflow dispatch.

## Secrets

No additional secrets are required. The workflow uses the automatic `GITHUB_TOKEN` for:
- Downloading Electron
- Creating releases
- Uploading artifacts

## Local Testing

Before pushing, you can test the Electron setup locally (on Windows):

```powershell
npm install electron electron-builder
npx electron .
```

## Workflow Files

- `.github/workflows/build-windows.yml` - Main build workflow
- `.github/workflows/sync-to-github.yml` - Optional Replit sync trigger
