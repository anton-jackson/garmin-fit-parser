# GitHub Setup Guide

## Pre-Publication Checklist

✅ **Already Done:**
- `.gitignore` configured to exclude build artifacts (DMG files, dist folder)
- README updated with download section
- Issue templates created
- Release workflow template created

## Steps to Publish on GitHub

### 1. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `FIT_extractor` (or your preferred name)
3. Description: "Desktop macOS app for exporting Garmin FIT file data to CSV"
4. Set to **Public** (or Private if you prefer)
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### 2. Update README with Your GitHub Username

Edit `README.md` and replace `YOUR_USERNAME` with your actual GitHub username in:
- The clone URL
- The releases link

### 3. Push to GitHub

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/FIT_extractor.git

# Push to GitHub
git branch -M main  # Rename master to main (GitHub standard)
git push -u origin main
```

### 4. Create Your First Release

1. Build the DMG:
   ```bash
   npm run electron:build
   ```

2. Go to your repository on GitHub
3. Click "Releases" → "Create a new release"
4. Tag: `v1.0.0`
5. Title: `v1.0.0 - Initial Release`
6. Description:
   ```
   ## Features
   - Import and parse Garmin FIT files
   - View all available data fields (records, laps, sessions)
   - Select fields for export
   - Export to CSV
   
   ## Installation
   Download the DMG file, open it, and drag the app to Applications.
   
   **Note**: On first launch, right-click the app and select "Open" to bypass macOS security warning.
   ```
7. Upload the DMG file: `dist/FIT File Data Exporter-1.0.0-arm64.dmg`
8. Click "Publish release"

### 5. (Optional) Add License

If you want to add a license:

```bash
# Choose a license (MIT is common for open source)
# You can create it manually or use GitHub's license chooser
```

### 6. (Optional) Enable GitHub Actions

If you want automated builds on tags, uncomment the workflow in `.github/workflows/release.yml` and configure it.

## What NOT to Commit

The following are already in `.gitignore` and should **never** be committed:
- `dist/` folder (build artifacts)
- `*.dmg` files (distribute via Releases)
- `*.app` bundles
- `node_modules/` (already ignored)
- `.DS_Store` (macOS system files)

## Best Practices

1. **Releases**: Always distribute DMG files via GitHub Releases, not in the repository
2. **Versioning**: Use semantic versioning (v1.0.0, v1.1.0, etc.)
3. **Tags**: Tag each release with `git tag v1.0.0 && git push --tags`
4. **Changelog**: Consider adding a CHANGELOG.md file for version history
5. **Code Signing**: For wider distribution, consider getting a Developer ID certificate from Apple

## Security Note

The app is currently **not code-signed**. Users will see a security warning on first launch. To distribute without warnings, you'll need:
- Apple Developer account ($99/year)
- Developer ID Application certificate
- Code signing configured in electron-builder
