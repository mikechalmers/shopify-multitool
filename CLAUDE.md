# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Shopify Cart Tools** - A Chrome extension (Manifest V3) that provides developer tools for Shopify storefronts. Allows developers to inspect, copy, and manipulate cart and product data via Shopify's AJAX API.

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
- **popup.html** - UI with cart and product tools sections that show/hide based on page context
- **popup.js** - Main logic using Chrome Extension APIs
- **background.js** - Service worker for badge updates
- **TODO.md** - Tracks future enhancements and feature ideas

### Key Architecture Pattern

The extension uses Chrome's `scripting.executeScript` API with `world: 'MAIN'` to inject functions directly into the Shopify storefront page context. This is critical because:

- Shopify API endpoints require same-origin credentials
- Functions must run in the page's execution context, not the extension's isolated world
- The pattern is: define helper functions (prefixed with `_`) → inject via `runInPage()` → return results to popup

**Important:** All `_*InPage()` functions are self-contained and cannot reference external functions, as they're injected into the page context.

### API Endpoints Used

The extension interacts with Shopify's standard AJAX APIs:

**Cart API:**
- **GET `/cart.js`** - Returns current cart as JSON (items, totals, attributes, etc.)
- **POST `/cart/clear.js`** - Empties the cart, returns updated (empty) cart JSON
- **POST `/cart/update.js`** - Updates cart properties (used to remove attributes by setting them to empty strings)

**Product API:**
- **GET `/products/{handle}.js`** - Returns product data as JSON (variants, pricing, availability, etc.)

All endpoints require `credentials: 'same-origin'` and should return `application/json` content type.

### Error Handling

The extension includes comprehensive error handling:

- **Content-Type validation** - All fetch operations check that responses are `application/json`, preventing cryptic errors when Shopify returns HTML error pages
- **HTTP status codes** - Errors include HTTP status codes for debugging (e.g., "Failed to access cart (HTTP 404)")
- **Context-aware timeouts** - Timeout errors include operation context (e.g., "Reading cart timed out after 10s")
- **Clipboard permission errors** - Specific messaging when clipboard write fails
- **Chrome extension restrictions** - Detects and explains when extension cannot run on browser pages (chrome://, etc.)
- **Per-button loading states** - Buttons show loading indicator (⏳) for visual feedback during operations
- **Accessibility** - Status messages announced to screen readers via `aria-live` regions

## Features

### Cart Tools (Visible on any Shopify page with cart API)
- **Log to console** - Logs formatted cart data to the page's console with item table
- **Copy cart JSON** - Copies full cart JSON to clipboard (with visual feedback)
- **Remove attributes** - Removes all cart-level attributes via `/cart/update.js`
- **Empty cart** - Clears all items and reloads the page

### Product Tools (Visible only on product pages)
- **Log to console** - Logs formatted product data to the page's console with variant table
- **Copy product JSON** - Copies full product JSON to clipboard

### Smart Context Detection
- Automatically detects if page is a Shopify store with cart API
- Shows/hides sections based on page type (cart tools, product tools)
- Supports localized and collection URLs (e.g., `/en/products/handle`, `/collections/name/products/handle`)

## Extension Permissions

Uses minimal permissions:
- `activeTab` - Access to the current tab when user clicks the extension icon
- `scripting` - Ability to inject and execute scripts in the page context
- `clipboardWrite` - Write JSON data to clipboard

No host permissions required - `activeTab` covers the use case.

## Testing Considerations

When testing or adding features:
- Test on real Shopify storefronts (not just development stores) to ensure AJAX API compatibility
- Test with localized URLs (e.g., `/en/products/handle`)
- Test on product collection pages (e.g., `/collections/summer/products/shirt`)
- The extension assumes classic Shopify themes with AJAX Cart API enabled (won't work on headless or custom checkouts without the API)
- Error messages now provide specific context about what failed and why
- Test accessibility with screen readers to ensure status announcements work
