# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Shopify Cart Tools** - A Chrome extension (Manifest V3) that provides developer tools for Shopify storefronts. Allows developers to inspect, copy, and manipulate cart data via Shopify's AJAX Cart API.

## Development Workflow

This is a pure browser extension with no build process. To develop:

1. **Load the extension:**
   ```bash
   # Navigate to chrome://extensions/ in Chrome
   # Enable "Developer mode" (toggle in top-right)
   # Click "Load unpacked" and select this directory
   ```

2. **Test changes:**
   - Make code edits to popup.js, popup.html, or manifest.json
   - Click the reload icon for this extension in chrome://extensions/
   - Navigate to any Shopify storefront (e.g., *.myshopify.com)
   - Click the extension icon to open the popup

## Architecture

### Core Components

- **manifest.json** - Defines extension metadata, permissions (`activeTab`, `scripting`, `clipboardWrite`), and popup configuration
- **popup.html** - Simple UI with 3 action buttons: "Log cart to console", "Copy cart JSON", "Empty cart"
- **popup.js** - Main logic using Chrome Extension APIs

### Key Architecture Pattern

The extension uses Chrome's `scripting.executeScript` API with `world: 'MAIN'` to inject functions directly into the Shopify storefront page context. This is critical because:

- Shopify's `/cart.js` and `/cart/clear.js` endpoints require same-origin credentials
- Functions must run in the page's execution context, not the extension's isolated world
- The pattern is: define helper functions (`_getCartInPage`, `_clearCartInPage`) → inject via `runInPage()` → return results to popup

### API Endpoints Used

The extension interacts with Shopify's standard AJAX Cart API:

- **GET `/cart.js`** - Returns current cart as JSON (items, totals, etc.)
- **POST `/cart/clear.js`** - Empties the cart, returns updated (empty) cart JSON

Both require `credentials: 'same-origin'` and return JSON responses.

### Error Handling

- `runInPage()` checks for valid active tab and script execution results
- Each button handler wraps operations in try/catch and displays errors via `setStatus()`
- Clear cart operation includes a confirmation dialog

## Extension Permissions

Currently uses minimal permissions:
- `activeTab` - Access to the current tab when user clicks the extension icon
- `scripting` - Ability to inject and execute scripts in the page context
- `clipboardWrite` - Write cart JSON to clipboard (for Copy button)

No host permissions are required because `activeTab` covers the use case.

## Testing Considerations

When testing or adding features:
- Test on real Shopify storefronts (not just development stores) to ensure AJAX API compatibility
- The extension assumes classic Shopify themes with AJAX Cart API enabled (won't work on headless or custom checkouts without the API)
- Error messages distinguish between "no active tab" vs "API request failed" vs "not a Shopify cart"
