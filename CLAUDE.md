# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Shopify Cart Tools** - A Chrome extension (Manifest V3) that provides developer tools for Shopify storefronts. Allows developers to inspect, copy, and manipulate cart and product data via Shopify's AJAX API. Includes advanced features like SKU viewer modal and integrated feedback system.

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
- **Log cart** - Logs formatted cart data to the page's console with item table
- **Copy cart** - Copies full cart JSON to clipboard (with visual feedback)
- **Remove attributes** - Removes all cart-level attributes via `/cart/update.js`
- **Empty cart** - Clears all items and reloads the page

### Product Tools (Visible only on product pages)
- **Log product** - Logs formatted product data to the page's console with variant table
- **Copy product** - Copies full product JSON to clipboard
- **Get SKUs** - Opens a modal displaying all product variants with their SKU and price. Each variant has an individual copy button for quick SKU copying.

### SKU Modal (v1.3.0+)
The extension includes a page-injected modal for displaying product variant information:
- **Page injection** - Modal is injected into the Shopify page DOM (not popup), allowing larger size (600px max-width, 80vh max-height)
- **CSS isolation** - Uses `all: initial` on all elements with `!important` flags to prevent page CSS from affecting modal styles
- **Inline styles** - All styles are inline and defensive to avoid conflicts with page CSS
- **High z-index** - Uses z-index: 999999 to appear above page content
- **Dark/light mode** - Automatically detects system color scheme preference using `prefers-color-scheme` and applies appropriate colors
- **Auto-close popup** - Popup closes automatically after modal launches, allowing immediate interaction with modal
- **Scrollable content** - Handles products with many variants
- **Variant cards** - Each displays variant title, SKU (monospace font), and price
- **Individual copy buttons** - Per-variant copy functionality with visual feedback (green checkmark for 2s on success, red X on failure)
- **Close options** - Close button (×), backdrop click, or ESC key
- **Self-contained** - All logic runs in page context with no dependencies on popup after injection

### Feedback System (v1.3.0+)
- **Feedback button** - Located in footer below status message with dashed border styling
- **Feedback modal** - Page-injected modal with form (similar architecture to SKU modal)
- **Form fields** - Name (optional), Email (optional), Feedback Type dropdown, Message (required)
- **API endpoint** - Located at `popup.js:493` - Update `API_ENDPOINT` constant with your API URL
- **Submission** - POSTs JSON with feedback data, user agent, timestamp, and current URL
- **Success/error handling** - Shows inline status messages, closes modal on success after 2s

### Smart Context Detection
- Automatically detects if page is a Shopify store with cart API
- Shows/hides sections based on page type (cart tools, product tools)
- Supports localized and collection URLs (e.g., `/en/products/handle`, `/collections/name/products/handle`)

## UI/UX Design (v1.3.0+)

### Visual Hierarchy
- **Section headers** - Bold, prominent headers (13px, weight 700, primary color) clearly separate Cart Tools from Product Tools
- **Button labels** - Descriptive labels that explicitly state what data they operate on ("Log cart", "Copy product")
- **Equal-width buttons** - Paired buttons (Log/Copy) use 50/50 split for balanced, professional appearance
- **Dashed border feedback button** - Subtle styling to avoid visual clutter in footer

### Design Principles
- **Clarity over brevity** - Button labels prioritize understanding ("Log cart" vs "Log")
- **Consistent spacing** - 6px gap between paired buttons, 8px gap in button groups, 12px below section headers
- **Visual feedback** - Loading states (⏳), success (✓), error states on all interactive elements
- **Accessibility** - ARIA labels, live regions for screen readers, proper semantic HTML

### Modal Architecture
- **Page injection pattern** - Modals injected into page DOM (not constrained by popup size)
- **CSS isolation strategy** - `all: initial` + `!important` flags prevent theme conflicts
- **Dark/light mode** - Automatic detection via `prefers-color-scheme` media query
- **Auto-close popup** - Popup closes after modal launch for immediate interaction
- **Consistent styling** - Both SKU and feedback modals use same color scheme and design language

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
