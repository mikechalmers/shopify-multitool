# Shopify Cart Tools

A Chrome extension that provides developer tools for inspecting and managing Shopify cart and product data on storefronts.

## Features

### Cart Tools
- **Log cart** - Output formatted cart data to your browser's developer console with item table
- **Copy cart** - Copy the complete cart JSON to your clipboard for analysis
- **Remove attributes** - Clear all cart-level attributes with one click
- **Empty cart** - Clear all items from the cart and reload the page

### Product Tools (on product pages)
- **Log product** - Output formatted product data to console with variant table
- **Copy product** - Copy complete product JSON to clipboard for analysis
- **Get SKUs** - Open a modal showing all product variants with SKU and price. Each variant has an individual copy button.

### Smart Features
- Automatically detects page context and shows relevant tools
- Supports localized URLs (e.g., `/en/products/handle`)
- Supports collection URLs (e.g., `/collections/summer/products/handle`)
- Per-button loading indicators for visual feedback
- Comprehensive error messages with specific troubleshooting context
- Screen reader accessible with ARIA live regions
- **Send Feedback** - Submit bug reports, feature requests, or general feedback directly from the extension

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

**Log cart**
- Outputs beautifully formatted cart data to the page's console (not the popup console)
- Open Developer Tools (F12 or Cmd+Option+I) on the storefront page to see the output
- Includes a table view of cart items with titles, variants, quantities, and prices

**Copy cart**
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

**Log product**
- Outputs formatted product data to the page's console
- Includes a table view of variants with SKU, price, and availability

**Copy product**
- Copies complete product JSON to clipboard
- Includes all variants, images, options, and metadata

**Get SKUs**
- Opens a large modal on the page displaying all product variants
- Shows each variant's title, SKU, and price
- Click "Copy" button on any variant to copy its SKU to clipboard
- Button shows green "✓" on success or red "✗" on failure for 2 seconds
- Close modal by clicking the X button, clicking outside the modal, or pressing ESC
- Modal appears on the page itself (not in the popup) for better visibility and larger size
- Automatically matches your system's dark/light mode preference
- Extension popup closes automatically after launching modal for immediate use
- Scrollable list supports products with many variants

### Send Feedback

**Located in footer below status message**
- Dashed border button for subtle appearance
- Opens a feedback form modal on the page

**Feedback Form**
- **Name** (optional) - Your name
- **Email** (optional) - For follow-up if needed
- **Feedback Type** - Choose from Bug Report, Feature Request, or General Feedback
- **Message** (required) - Your feedback, bug report, or feature request
- Submit button sends data to developer's API endpoint
- Success message appears and modal auto-closes after 2 seconds
- Form includes helpful metadata: timestamp, browser info, and current page URL
- Fully isolated from page CSS with dark/light mode support

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

**This extension does not collect, store, or transmit any data automatically.**

All core operations happen locally in your browser:
- Cart data is fetched directly from the Shopify site you're viewing
- No information is sent to external servers without your explicit action
- No tracking or analytics

**Feedback Feature:**
- Only when you explicitly click "Send Feedback" and submit the form, data is sent to the developer's API
- Data submitted includes: your optional name/email, feedback message, feedback type, timestamp, browser user agent, and current page URL
- This is entirely optional and only happens when you choose to send feedback

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
