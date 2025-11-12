# Changelog

All notable changes to Cart Tools for Shopify will be documented in this file.

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
