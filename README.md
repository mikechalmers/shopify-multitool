# Shopify Cart Tools

A Chrome extension that provides developer tools for inspecting and managing Shopify cart data on storefronts.

## Features

- **View Cart Summary** - See item count and total price at a glance
- **Log Cart to Console** - Output formatted cart data to your browser's developer console
- **Copy Cart JSON** - Copy the complete cart object to your clipboard for analysis
- **Empty Cart** - Clear all items from the cart with one click

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
3. The popup will show:
   - Current cart summary (item count and total)
   - Three action buttons

### Actions

**Log cart to console**
- Outputs beautifully formatted cart data to the page's console (not the popup console)
- Open Developer Tools (F12 or Cmd+Option+I) on the storefront page to see the output
- Includes a table view of cart items with titles, variants, quantities, and prices

**Copy cart JSON**
- Copies the complete cart object as formatted JSON to your clipboard
- Perfect for debugging, testing, or data analysis
- Button shows "✓ Copied!" confirmation for 2 seconds

**Empty cart**
- Clears all items from the cart
- Shows a confirmation dialog before proceeding
- Automatically reloads the page to reflect changes

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

**"Not on a Shopify cart page" message**
- The extension can't detect a Shopify cart on the current page
- Make sure you're on a Shopify storefront (not the admin panel)
- Some custom implementations may not expose the standard cart API

**"Cannot access /cart.js" error**
- The store may be using a custom cart implementation
- Try refreshing the page and clicking the extension icon again
- If the error persists, the store may not support the AJAX Cart API

**Cart actions don't work**
- Ensure you're on the actual storefront page (not a preview or iframe)
- Check that JavaScript is enabled in your browser
- Try reloading the extension: go to `chrome://extensions/`, find Shopify Cart Tools, and click the reload icon

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
