#!/usr/bin/env node

/**
 * Build script for Chrome extension
 * Reads version from manifest.json and creates a distributable zip file
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read version from manifest.json
const manifestPath = path.join(__dirname, '../manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;

// Define output filename
const zipFileName = `cart-tools-for-shopify-v${version}.zip`;

console.log(`📦 Building Chrome extension v${version}...`);

// Clean up old builds
console.log('🧹 Cleaning old builds...');
execSync('rm -f *.zip', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

// Create zip file with required files
console.log(`📁 Creating ${zipFileName}...`);
const files = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'background.js',
  'icons/',
  'PRIVACY.md'
];

const zipCommand = `zip -r ${zipFileName} ${files.join(' ')} -x "*.DS_Store"`;

try {
  execSync(zipCommand, { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  console.log(`✅ Build complete: ${zipFileName}`);
  console.log(`\n📊 File size: ${(fs.statSync(path.join(__dirname, '..', zipFileName)).size / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
