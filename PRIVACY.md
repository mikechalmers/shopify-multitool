# Privacy Policy for Shopify Cart Tools

**Effective Date:** October 14, 2025
**Last Updated:** October 14, 2025

## Overview

Shopify Cart Tools is a Chrome extension designed to help developers inspect and manage Shopify cart data on storefronts. This privacy policy explains our data practices.

## Data Collection

**We do not collect, store, transmit, or share any user data.**

Specifically:
- No personal information is collected
- No browsing history is tracked
- No cart data is transmitted off your device
- No analytics or telemetry are implemented
- No cookies are set by this extension
- No third-party services are used

## Data Usage

All operations performed by this extension occur **locally in your browser**:
- Cart data is fetched directly from the Shopify storefront you're visiting using the public AJAX Cart API
- Data is only displayed to you or copied to your clipboard when you explicitly click a button
- No data leaves your browser or is stored persistently by the extension

## Permissions

The extension requests the following Chrome permissions:
- **activeTab** - Allows the extension to interact with the current tab when you click the extension icon
- **scripting** - Enables injection of JavaScript to call Shopify's cart API in the page context
- **clipboardWrite** - Allows copying cart JSON data to your clipboard when you click "Copy cart JSON"

These permissions are only used for the stated functionality and do not enable any data collection.

## Changes to This Policy

If we ever change our data handling practices, we will update this policy and notify users through the Chrome Web Store listing.

## Contact

For questions or concerns about privacy, please open an issue at:
https://github.com/anthropics/shopify-cart-tools/issues

---

**Summary:** This extension operates entirely locally in your browser. We don't see, store, or transmit any of your data.
