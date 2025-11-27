# Build System

This project uses npm scripts to simplify the build and release process.

## Quick Start

```bash
# Build a distributable ZIP file
npm run build

# The output will be: cart-tools-for-shopify-v1.3.1.zip
```

## Available Scripts

### Building

```bash
# Build the extension (recommended)
npm run build
```

This will:
- Read the version from `manifest.json`
- Clean up any old `.zip` files
- Create a new ZIP with the correct version number
- Show the final file size

**Output:** `cart-tools-for-shopify-v{version}.zip`

### Version Management

```bash
# Bump patch version (1.3.1 → 1.3.2)
npm run version:bump:patch

# Bump minor version (1.3.1 → 1.4.0)
npm run version:bump:minor

# Bump major version (1.3.1 → 2.0.0)
npm run version:bump:major
```

Version bumping automatically updates:
- `manifest.json` - Chrome extension version
- `package.json` - npm package version
- `popup.js` - `EXTENSION_VERSION` constant in feedback modal

After bumping, run `npm run build` to create the new package.

### Utilities

```bash
# Clean up old ZIP files
npm run clean

# Alternative zip command (uses inline version reading)
npm run zip
```

## Workflow Example

### Preparing a New Release

```bash
# 1. Bump the version
npm run version:bump:patch

# Output:
# 📝 Updated manifest.json: 1.3.1 → 1.3.2
# 📝 Updated package.json: 1.3.1 → 1.3.2
# 📝 Updated popup.js: 1.3.1 → 1.3.2
# ✅ Version bumped: 1.3.1 → 1.3.2
# 📦 Run 'npm run build' to create the new distribution package.

# 2. Build the distributable package
npm run build

# Output:
# 📦 Building Chrome extension v1.3.2...
# 🧹 Cleaning old builds...
# 📁 Creating cart-tools-for-shopify-v1.3.2.zip...
# ✅ Build complete: cart-tools-for-shopify-v1.3.2.zip
# 📊 File size: 35.00 KB

# 3. Test the extension
# Load the ZIP in Chrome at chrome://extensions/

# 4. Commit the version bump
git add .
git commit -m "chore: bump version to 1.3.2"
git tag v1.3.2
git push && git push --tags

# 5. Upload to Chrome Web Store
# Use cart-tools-for-shopify-v1.3.2.zip
```

## What Gets Included

The build script packages these files:
- `manifest.json` - Extension metadata
- `popup.html` - UI
- `popup.js` - Main logic
- `background.js` - Service worker
- `icons/` - All icon sizes (16, 32, 48, 128)
- `PRIVACY.md` - Privacy policy

## What Gets Excluded

These files are automatically excluded:
- `.DS_Store` - macOS metadata
- Development documentation (`README.md`, `CLAUDE.md`, etc.)
- Build artifacts (`*.zip`, `node_modules/`)
- Git files (`.git/`, `.gitignore`)
- Source code metadata

## Manual Build (if needed)

If you need to build manually without npm:

```bash
zip -r cart-tools-for-shopify-v1.3.1.zip \
  manifest.json \
  popup.html \
  popup.js \
  background.js \
  icons/ \
  PRIVACY.md \
  -x "*.DS_Store"
```

## Troubleshooting

### Version mismatch errors

If `manifest.json`, `package.json`, and `popup.js` have different versions:

```bash
# Fix: Manually edit the files or use version bump script
npm run version:bump:patch  # This syncs all versions
```

### Build script not found

```bash
# Make sure scripts are executable
chmod +x scripts/*.js
```

### Zip command not found

The build scripts require the `zip` command to be available. This is pre-installed on macOS and most Linux distributions. On Windows, use WSL or Git Bash.

## CI/CD Integration

The build scripts are designed to work in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm install

- name: Build extension
  run: npm run build

- name: Upload artifact
  uses: actions/upload-artifact@v3
  with:
    name: extension-package
    path: "*.zip"
```
