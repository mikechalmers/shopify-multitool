# Shopify Cart Tools

A Chrome extension that provides developer tools for inspecting and managing Shopify cart and product data on storefronts.

## Features

### Cart Tools
- **View Cart Summary** - See item count and total price at a glance
- **Log Cart to Console** - Output formatted cart data to your browser's developer console with item table
- **Copy Cart JSON** - Copy the complete cart object to your clipboard for analysis
- **Remove Attributes** - Clear all cart-level attributes with one click
- **Empty Cart** - Clear all items from the cart with one click

### Product Tools (on product pages)
- **Log Product to Console** - Output formatted product data with variant table
- **Copy Product JSON** - Copy complete product data to clipboard for analysis

### Smart Features
- Automatically detects page context and shows relevant tools
- Supports localized URLs (e.g., `/en/products/handle`)
- Supports collection URLs (e.g., `/collections/summer/products/handle`)
- Per-button loading indicators for visual feedback
- Comprehensive error messages with specific troubleshooting context
- Screen reader accessible with ARIA live regions

## Installation

### From Chrome Web Store
1. Visit the [Shopify Cart Tools page](https://chrome.google.com/webstore) on the Chrome Web Store
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (for development)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked" and select the extension directory

## Usage

1. **Navigate to any Shopify storefront** (e.g., `*.myshopify.com` or any site running Shopify)
2. **Click the extension icon** in your Chrome toolbar
3. The popup will automatically detect the page type and show relevant tools

### Cart Tools (shown on all Shopify pages)

**Log to console**
- Outputs beautifully formatted cart data to the page's console (not the popup console)
- Open Developer Tools (F12 or Cmd+Option+I) on the storefront page to see the output
- Includes a table view of cart items with titles, variants, quantities, and prices

**Copy (inline button)**
- Copies the complete cart object as formatted JSON to your clipboard
- Perfect for debugging, testing, or data analysis
- Button shows "✓" confirmation for 2 seconds

**Remove attributes**
- Removes all cart-level attributes (custom properties set on the cart)
- Useful for testing or clearing test data
- Shows a confirmation dialog before proceeding
- Automatically reloads the page after removal

**Empty cart**
- Clears all items from the cart
- Shows a confirmation dialog before proceeding
- Automatically reloads the page to reflect changes

### Product Tools (shown only on product pages)

**Log to console**
- Outputs formatted product data to the page's console
- Includes a table view of variants with SKU, price, and availability

**Copy (inline button)**
- Copies complete product JSON to clipboard
- Includes all variants, images, options, and metadata

## Compatibility

This extension works with **Shopify storefronts that use the classic AJAX Cart API**:

✅ **Works with:**
- Classic Shopify themes (Debut, Brooklyn, Narrative, etc.)
- Most custom themes built on Shopify's theme framework
- Any store with `/cart.js` and `/cart/clear.js` endpoints enabled

❌ **Does not work with:**
- Headless Shopify implementations without the AJAX Cart API
- Custom checkout implementations that don't use Shopify's cart endpoints
- Non-Shopify sites

## Privacy

**This extension does not collect, store, or transmit any data.**

All operations happen locally in your browser:
- Cart data is fetched directly from the Shopify site you're viewing
- No information is sent to external servers
- No tracking or analytics

See [PRIVACY.md](PRIVACY.md) for full details.

## Troubleshooting

**"Visit a Shopify store to use this extension"**
- The extension can't detect a Shopify storefront on the current page
- Make sure you're on a Shopify storefront (not the admin panel, checkout, or browser pages)
- Some custom implementations may not expose the standard cart API

**"Cannot access this page" or "Extensions cannot run on browser pages"**
- Chrome extensions are restricted on browser pages (chrome://, chrome-extension://, etc.)
- Navigate to an actual website to use the extension

**"Failed to access cart (HTTP 404/500)"**
- The store may be using a custom cart implementation
- HTTP status code indicates the specific error (404 = not found, 500 = server error)
- Try refreshing the page and clicking the extension icon again
- If the error persists, the store may not support the AJAX Cart API

**"Expected JSON response but got text/html"**
- The server returned an error page instead of JSON data
- This usually means the store is in maintenance mode or the API is unavailable
- Check if the storefront loads correctly in your browser

**"Operation timed out after 10s"**
- The operation took too long to complete
- Check your internet connection
- The error message will specify which operation timed out (e.g., "Reading cart timed out")
- Try again after a moment

**"Failed to copy to clipboard"**
- Browser may be blocking clipboard access
- Make sure you've granted clipboard permissions
- Try clicking the extension icon again and retrying

**"No attributes found on cart"**
- The cart doesn't have any custom attributes to remove
- This is expected if you haven't set custom cart attributes

## Permissions

The extension requests these permissions:

- **activeTab** - Access the current tab when you click the extension icon
- **scripting** - Inject code to call Shopify's cart API
- **clipboardWrite** - Copy cart data to your clipboard

These permissions are only used for stated functionality. See [PRIVACY.md](PRIVACY.md) for details.

## Development

For developers who want to modify or contribute:

```bash
# Clone the repository
git clone https://github.com/your-username/shopify-cart-tools.git

# Load the extension in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the project directory
```

See [CLAUDE.md](CLAUDE.md) for architecture details and development guidelines.

## Support

Found a bug or have a feature request?

- Open an issue: https://github.com/your-username/shopify-cart-tools/issues
- Include your Chrome version, Shopify theme (if known), and steps to reproduce

## License

MIT License - See LICENSE file for details

## Credits

Built with Chrome's Manifest V3 extension APIs.
