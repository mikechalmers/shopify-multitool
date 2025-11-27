#!/usr/bin/env node

/**
 * Version bump script
 * Updates version in manifest.json, popup.js, and package.json
 * Usage: node bump-version.js [patch|minor|major]
 */

const fs = require('fs');
const path = require('path');

const bumpType = process.argv[2];

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('❌ Invalid bump type. Use: patch, minor, or major');
  process.exit(1);
}

// Parse and increment version
function incrementVersion(version, type) {
  const parts = version.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${parts[0] + 1}.0.0`;
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`;
    case 'patch':
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
}

// Update manifest.json
const manifestPath = path.join(__dirname, '../manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const oldVersion = manifest.version;
const newVersion = incrementVersion(oldVersion, bumpType);
manifest.version = newVersion;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`📝 Updated manifest.json: ${oldVersion} → ${newVersion}`);

// Update package.json
const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`📝 Updated package.json: ${oldVersion} → ${newVersion}`);

// Update popup.js (find and replace EXTENSION_VERSION constant)
const popupPath = path.join(__dirname, '../popup.js');
let popupContent = fs.readFileSync(popupPath, 'utf8');
const versionRegex = /(const EXTENSION_VERSION = ')([^']+)(')/;
const match = popupContent.match(versionRegex);

if (match) {
  popupContent = popupContent.replace(versionRegex, `$1${newVersion}$3`);
  fs.writeFileSync(popupPath, popupContent);
  console.log(`📝 Updated popup.js: ${match[2]} → ${newVersion}`);
} else {
  console.warn('⚠️  Could not find EXTENSION_VERSION in popup.js');
}

console.log(`\n✅ Version bumped: ${oldVersion} → ${newVersion}`);
console.log(`\n📦 Run 'npm run build' to create the new distribution package.`);
