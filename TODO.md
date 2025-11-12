# Future Enhancements

This file tracks potential improvements and features for future versions of Cart Tools for Shopify.

## Low Priority / Future Features

### UX Improvements

- **Custom confirmation dialogs** - Replace native `confirm()` with styled, non-blocking modal dialogs that match the extension's design
- **Keyboard shortcuts** - Add keyboard shortcuts for power users (e.g., Cmd+L to log cart, Cmd+C to copy)
- **Last updated timestamp** - Display when cart data was last fetched in the summary section
- **Toast notifications** - Non-intrusive notifications for successful operations instead of status bar only

### Technical Improvements

- **Retry logic** - Add automatic retry for initialization on slow-loading pages
- **Incognito mode** - Test and document behavior in incognito/private browsing mode
- **Performance monitoring** - Track operation timing and surface to user when operations are slow
- **Caching** - Cache cart data briefly to reduce API calls when rapidly clicking buttons

### Feature Ideas

- **Cart manipulation** - Add/remove specific items, adjust quantities
- **Discount code testing** - Apply and test discount codes
- **Cart notes** - View and edit cart note field
- **Line item properties** - View and edit line item properties
- **Export formats** - Export cart/product data as CSV or other formats
- **Bulk operations** - Batch operations on multiple products
- **Variant selector** - Quick add specific variant to cart from product page

### Developer Experience

- **Debug mode** - Verbose logging option for troubleshooting
- **API response inspector** - View raw API responses
- **Performance metrics** - Display request timing and response sizes
- **Network error details** - More detailed network debugging info

## Completed Improvements

### v1.2.0
- ✅ Better error handling with specific context
- ✅ JSON parsing error detection and helpful messages
- ✅ Refactored duplicated fetch logic
- ✅ Accessibility improvements (aria-live, aria-labels)
- ✅ Per-button loading states
- ✅ Standardized error messages
- ✅ Better clipboard error handling
- ✅ Timeout context in error messages
- ✅ Improved product URL detection (localized URLs)

### v1.1.0
- ✅ Product tools (log/copy product data)
- ✅ Remove cart attributes functionality
- ✅ Inline copy buttons
- ✅ Dynamic badge updates
