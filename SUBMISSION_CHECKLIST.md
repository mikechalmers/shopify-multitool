# Chrome Web Store Submission Checklist

This checklist covers all requirements for submitting "Cart Tools for Shopify" to the Chrome Web Store.

## ✅ Pre-Submission Completed Items

- [x] Extension name avoids trademark issues ("Cart Tools for Shopify" instead of "Shopify Cart Tools")
- [x] Version number updated to 1.0.0 (production-ready)
- [x] Privacy policy created (PRIVACY.md)
- [x] User-facing README with usage instructions
- [x] Author field added to manifest.json
- [x] User-friendly error messages implemented
- [x] All required icons present (16px, 32px, 48px, 128px)
- [x] Manifest V3 compliance
- [x] Content Security Policy defined
- [x] Minimal permissions requested (activeTab, scripting, clipboardWrite)

## 📋 Required Before Submission

### 1. Developer Account Setup
- [ ] Register for Chrome Web Store Developer account ($5 one-time fee)
  - Go to: https://chrome.google.com/webstore/devconsole/
  - Sign in with Google account
  - Pay $5 registration fee

### 2. Store Listing Assets (CRITICAL)

#### Screenshots (Required - at least 1, max 5)
- [ ] Create 1280x800px (or 640x400px) screenshots showing:
  - Extension popup open on a Shopify store
  - Cart summary display with items
  - Console output after clicking "Log cart to console"
  - Success state after copying cart JSON

**How to create:**
```bash
# 1. Load extension in Chrome (chrome://extensions/)
# 2. Visit a Shopify demo store (e.g., https://shop.polymer-project.org or any *.myshopify.com)
# 3. Add items to cart
# 4. Click extension icon
# 5. Take screenshots (Cmd+Shift+4 on Mac, Windows+Shift+S on Windows)
# 6. Crop/resize to 1280x800px using any image editor
```

#### Promotional Images (Optional but Recommended)
- [ ] Small promotional tile: 440x280px
- [ ] Large promotional tile: 920x680px (for featured placement)
- [ ] Marquee promotional tile: 1400x560px (for featured placement)

**Design tips:**
- Show the extension icon and name
- Include a brief tagline: "Developer tools for Shopify carts"
- Use clean, professional design
- Match the extension's color scheme (blues/greens from the UI)

### 3. Store Listing Content

#### Item Details
- [ ] **Detailed Description** (minimum 3-5 paragraphs):
  ```
  Cart Tools for Shopify is a powerful yet lightweight developer extension that provides
  essential debugging and inspection tools for Shopify storefronts. Access cart and
  product data instantly with an intuitive interface that adapts to your workflow.

  CART TOOLS:
  • View cart summary (item count and total) at a glance
  • Log beautifully formatted cart data to browser console with item tables
  • Copy complete cart JSON to clipboard with inline copy button
  • Remove all cart attributes with one click (perfect for testing)
  • Empty cart with one click (with confirmation)
  • Real-time cart item badge on extension icon

  PRODUCT TOOLS (shown only on product pages):
  • Automatically detect when you're on a product page
  • Log detailed product data including all variants to console
  • Copy complete product JSON with inline copy button
  • View variant information in formatted console tables
  • Works with standard, localized, and collection product URLs

  SMART FEATURES:
  • Context-aware UI - automatically shows/hides relevant tools based on page type
  • Per-button loading indicators for clear visual feedback
  • Comprehensive error messages with specific troubleshooting context
  • Support for localized URLs (e.g., /en/products/handle)
  • Dark mode support that matches your system preferences
  • Timeout protection for slow-loading pages with detailed error context
  • Screen reader accessible with ARIA live regions
  • Works directly in the page context for reliable API access

  PERFECT FOR:
  • Shopify theme developers debugging cart and product functionality
  • Frontend developers testing cart and checkout integrations
  • Developers working with cart attributes and custom properties
  • QA engineers verifying product and cart behavior
  • Developers building custom cart experiences
  • Anyone needing quick access to Shopify AJAX API data

  COMPATIBILITY:
  Works with classic Shopify themes and any storefront using Shopify's
  AJAX Cart API (/cart.js, /cart/update.js, /products/*.js endpoints).
  Supports standard, localized, and collection product URLs. Does not work
  with headless implementations without the standard API endpoints.

  PRIVACY & SECURITY:
  This extension does not collect, store, or transmit any data. All
  operations occur locally in your browser. No external servers, no tracking,
  no telemetry. Your data stays private. See our privacy policy for full details.
  ```

- [ ] **Category**: Select "Developer Tools"

- [ ] **Language**: English (or add additional languages if localized)

#### Privacy
- [ ] **Single Purpose Description** (required for extensions with narrow use case):
  ```
  This extension provides developer tools for inspecting and managing
  Shopify cart data on storefronts via the AJAX Cart API.
  ```

- [ ] **Permission Justifications** (explain each permission):
  - **activeTab**: "Access the current tab to inject scripts that fetch cart
    data from the Shopify storefront you're viewing"
  - **scripting**: "Execute JavaScript in the page context to call Shopify's
    /cart.js and /cart/clear.js endpoints with proper credentials"
  - **clipboardWrite**: "Copy cart JSON data to clipboard when you click the
    'Copy cart JSON' button"

- [ ] **Host Permissions Justification**: None required (using activeTab)

- [ ] **Remote Code Justification**: N/A (no remote code)

- [ ] **Privacy Policy**: Link to hosted privacy policy
  - Option 1: Host PRIVACY.md on GitHub Pages
  - Option 2: Create a simple static website
  - Option 3: Use GitHub raw URL (not recommended, but acceptable)
  - **URL format**: Must be accessible HTTPS URL

### 4. Technical Requirements

#### Testing
- [ ] Test extension in Chrome (latest stable version)
- [ ] Test on multiple Shopify stores (demo stores, myshopify.com stores)
- [ ] Verify all features work:
  - [ ] Badge updates correctly
  - [ ] Log to console shows formatted output
  - [ ] Copy to clipboard works
  - [ ] Clear cart prompts confirmation and works
  - [ ] Error messages display for non-Shopify sites

#### Code Quality
- [ ] No console errors or warnings
- [ ] No obfuscated code (Chrome Web Store policy)
- [ ] No external scripts loaded (all code is local)
- [ ] No eval() or dangerous functions
- [ ] CSP properly configured

#### Package Preparation
- [ ] Create ZIP file of extension:
  ```bash
  cd /Users/michaelchalmers/shopify-multitool

  # Create zip with only required files for Chrome Web Store
  zip -r cart-tools-for-shopify-v1.2.0.zip \
    manifest.json \
    popup.html \
    popup.js \
    background.js \
    icons/ \
    PRIVACY.md \
    -x "*.DS_Store" "*.git*"

  # Alternative: Exclude unnecessary files from current directory
  # zip -r cart-tools-for-shopify-v1.2.0.zip . \
  #   -x "*.git*" "*.DS_Store" "node_modules/*" "*.md" "!PRIVACY.md" \
  #   "TODO.md" "CHANGELOG.md" "CLAUDE.md" "SUBMISSION_CHECKLIST.md" "README.md"
  ```

  **Files required for Chrome Web Store:**
  - ✅ `manifest.json` - Extension metadata
  - ✅ `popup.html` - UI
  - ✅ `popup.js` - Logic
  - ✅ `background.js` - Service worker
  - ✅ `icons/` - All icon sizes (16, 32, 48, 128)
  - ✅ `PRIVACY.md` - Privacy policy (if not hosted elsewhere)

  **Files to exclude:**
  - ❌ `.git/` - Git repository
  - ❌ `.DS_Store` - macOS metadata
  - ❌ `README.md` - Development docs (not needed in extension)
  - ❌ `CLAUDE.md` - Development docs
  - ❌ `CHANGELOG.md` - Development docs
  - ❌ `TODO.md` - Development docs
  - ❌ `SUBMISSION_CHECKLIST.md` - This file
  - ❌ `node_modules/` - Dependencies (if any)
  - ❌ `.gitignore` - Git config

### 5. Publishing Steps

1. [ ] **Upload ZIP**
   - Go to Chrome Web Store Developer Dashboard
   - Click "New Item"
   - Upload your ZIP file
   - Wait for automated analysis (usually 1-5 minutes)

2. [ ] **Fix any issues** flagged by automated review

3. [ ] **Fill out store listing**
   - Add all descriptions, screenshots, promotional images
   - Set pricing (free)
   - Select distribution (Public or Unlisted)

4. [ ] **Add privacy practices** disclosure

5. [ ] **Submit for review**
   - Review typically takes 1-3 business days
   - May require additional information or changes

### 6. Post-Submission

- [ ] Respond promptly to any reviewer feedback
- [ ] Once approved, test the published version
- [ ] Update README.md with Chrome Web Store link
- [ ] Consider creating social media posts/announcements

## 🚨 Common Rejection Reasons to Avoid

- ❌ Missing or invalid privacy policy URL
- ❌ Insufficient permission justifications
- ❌ Poor quality or missing screenshots
- ❌ Vague or misleading description
- ❌ Trademark violations in name/description
- ❌ Asking for unnecessary permissions
- ❌ Obfuscated or minified code without source maps
- ❌ Extension doesn't work as described

## 📚 Additional Resources

- **Chrome Web Store Developer Documentation**: https://developer.chrome.com/docs/webstore/
- **Program Policies**: https://developer.chrome.com/docs/webstore/program-policies/
- **Best Practices**: https://developer.chrome.com/docs/webstore/best-practices/
- **Review Process**: https://developer.chrome.com/docs/webstore/review-process/

## 💡 Tips for Faster Approval

1. Write clear, detailed permission justifications
2. Provide high-quality screenshots showing actual functionality
3. Be honest about what the extension does (don't oversell)
4. Test thoroughly before submitting
5. Have privacy policy accessible before submission
6. Respond to reviewer questions within 24 hours
