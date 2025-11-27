# Changelog

All notable changes to Cart Tools for Shopify will be documented in this file.

## [1.3.0] - 2025-11-12

### Added
- **Get SKUs modal** - New button in Product Tools that opens a page-injected modal displaying all product variants
  - Shows variant title, SKU, and price for each variant
  - Individual "Copy" button per variant for quick SKU copying
  - Modal injected into page DOM (not popup) for larger size (600px max-width, 80vh max-height)
  - Scrollable content supports products with many variants
  - Multiple close options: close button (×), backdrop click, or ESC key
  - Visual feedback: green checkmark on successful copy, red X on failure
  - **CSS isolation** - Uses `all: initial` with `!important` flags to prevent page CSS inheritance
  - Inline styles with defensive styling to avoid conflicts with page CSS
  - High z-index (999999) to appear above page content
  - **Dark/light mode support** - Automatically detects and matches system color scheme preference
  - **Auto-close popup** - Extension popup closes automatically after launching modal for immediate interaction

- **Feedback system** - New feedback button in footer for submitting bug reports, feature requests, and general feedback
  - Page-injected modal form with same architecture as SKU modal
  - Form fields: Name (optional), Email (optional), Feedback Type (dropdown), Message (required)
  - Submits to configurable API endpoint via POST request
  - Includes metadata: timestamp, user agent, and current page URL
  - Success/error handling with inline status messages
  - Auto-closes modal after successful submission
  - Full CSS isolation and dark/light mode support
  - Dashed border styling for subtle footer placement

### Changed
- **Button labels improved** - All buttons now explicitly state what they operate on:
  - "Log to console" → "Log cart" / "Log product"
  - "Copy" → "Copy cart" / "Copy product"
  - Makes it immediately clear which data each button affects

- **Section headers enhanced** - Cart Tools and Product Tools headers now more prominent:
  - Increased font size (11px → 13px)
  - Increased font weight (600 → 700)
  - Changed from muted gray to primary text color with 90% opacity
  - Better letter spacing (0.5px → 0.8px) for improved readability
  - Creates clearer visual hierarchy and separation between sections

- **Button layout optimized** - Paired buttons (Log/Copy) now have equal width split (50/50) for balanced appearance and professional look

### Technical Improvements
- All modals use comprehensive CSS isolation to prevent Shopify theme conflicts
- Modal dark mode detection via `prefers-color-scheme` media query
- Auto-closing popup behavior for better modal interaction UX
- Defensive inline styling with `!important` flags throughout modal components
- Form validation for feedback modal (message required)
- Configurable API endpoint for feedback submissions (popup.js line 493)

## [1.2.0] - 2025-11-03

### Added
- Remove cart attributes functionality - removes all cart-level attributes with one click
- Per-button loading states with visual indicators (⏳) during operations
- Comprehensive error handling with specific context for different failure scenarios
- Content-type validation for all API responses to prevent cryptic JSON parsing errors
- Context-aware timeout messages that explain which operation timed out
- Specific clipboard permission error messages
- Chrome extension restriction detection and helpful messaging
- Support for localized product URLs (e.g., `/en/products/handle`)
- Support for collection product URLs (e.g., `/collections/summer/products/handle`)
- Accessibility improvements:
  - `aria-live` region for status updates (screen reader announcements)
  - `aria-label` attributes on all buttons for better screen reader support
- Timeout cancellation for copy button checkmarks (prevents race conditions)

### Changed
- Improved error messages to include HTTP status codes (e.g., "Failed to access cart (HTTP 404)")
- Refactored duplicated fetch logic for better maintainability
- Enhanced initialization error handling with more helpful messages
- Updated UI: inline copy buttons with "Copy" text visible (not icon-only)
- Better clipboard error handling with specific permission failure messages
- Improved `runInPage()` error detection for common Chrome extension scenarios

### Fixed
- JSON parsing errors now show helpful messages instead of "Unexpected token <"
- Timeout errors now include operation context (e.g., "Reading cart timed out")
- Copy button checkmark timeout is now properly cancelled when clicked again
- Product detection now works with localized and collection URLs

## [1.1.0] - 2025-11-03

### Added
- Product tools section (log and copy product JSON)
- Dynamic UI that shows/hides sections based on page context
- Badge updates via background service worker
- Improved cart summary display
- Console logging with formatted tables for cart items and product variants

### Changed
- UI redesigned with sections for Cart Tools and Product Tools
- Buttons now use emoji icons for visual clarity

## [1.0.0] - 2025-11-03

### Added
- Initial release
- Log cart to console functionality
- Copy cart JSON to clipboard
- Empty cart functionality
- Basic error handling
- Chrome Manifest V3 implementation
- Dark mode support
