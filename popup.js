/**
 * Cart Tools for Shopify - Popup Script
 * Main logic for the extension popup UI
 */

const statusEl = document.getElementById('status');
const summaryEl = document.getElementById('summary');
const logBtn = document.getElementById('log');
const copyBtn = document.getElementById('copy');
const clearBtn = document.getElementById('clear');
const removeAttrsBtn = document.getElementById('remove-attrs');
const logProductBtn = document.getElementById('log-product');
const copyProductBtn = document.getElementById('copy-product');

const API_TIMEOUT = 10000; // 10 seconds

// Track copy button timeouts for cancellation
let copyCartTimeout = null;
let copyProductTimeout = null;

/**
 * Gets the active tab ID
 * @returns {Promise<number|undefined>} The active tab ID or undefined
 */
async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

/**
 * Adds a timeout to a promise with context
 * @param {Promise} promise - The promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @param {string} operation - Description of the operation for error message
 * @returns {Promise} The promise with timeout
 */
function withTimeout(promise, ms, operation = 'Operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${ms / 1000}s. Please check your connection and try again.`)), ms)
    )
  ]);
}

/**
 * Fetches cart data from the Shopify page
 * Injected into page context
 * @returns {Promise<Object>} Cart JSON data
 */
function _getCartInPage() {
  return (async () => {
    const res = await fetch('/cart.js', {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (!res.ok) {
      throw new Error(`Failed to access cart (HTTP ${res.status})`);
    }

    try {
      return await res.json();
    } catch (parseError) {
      const contentType = res.headers.get('content-type');
      throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}. This may not be a Shopify store or the API is unavailable.`);
    }
  })();
}

/**
 * Logs cart data to the page console
 * Injected into page context
 * @returns {Promise<Object>} Cart JSON data
 */
function _logCartInPage() {
  return (async () => {
    const res = await fetch('/cart.js', {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (!res.ok) {
      throw new Error(`Failed to access cart (HTTP ${res.status})`);
    }

    let cart;
    try {
      cart = await res.json();
    } catch (parseError) {
      const contentType = res.headers.get('content-type');
      throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}. This may not be a Shopify store or the API is unavailable.`);
    }

    // Log with nice formatting to the page console
    console.group('%c🛒 Cart Tools for Shopify', 'font-size: 14px; font-weight: bold; color: #5C6AC4;');
    console.log('Cart data:', cart);
    console.log(`Items: ${cart.items?.length ?? 0} | Total: ${cart.currency || 'USD'} ${cart.total_price ? (cart.total_price / 100).toFixed(2) : '0.00'}`);
    if (cart.items && cart.items.length > 0) {
      console.table(cart.items.map(item => ({
        title: item.title,
        variant: item.variant_title || '-',
        quantity: item.quantity,
        price: `${cart.currency || 'USD'} ${item.price ? (item.price / 100).toFixed(2) : '0.00'}`
      })));
    }
    console.groupEnd();

    return cart;
  })();
}

/**
 * Clears the cart on the Shopify page
 * Injected into page context
 * @returns {Promise<Object>} Updated cart JSON data
 */
function _clearCartInPage() {
  return (async () => {
    const res = await fetch('/cart/clear.js', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (!res.ok) {
      throw new Error(`Failed to clear cart (HTTP ${res.status})`);
    }

    try {
      return await res.json();
    } catch (parseError) {
      const contentType = res.headers.get('content-type');
      throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}.`);
    }
  })();
}

/**
 * Removes all cart attributes on the Shopify page
 * Injected into page context
 * @returns {Promise<Object>} Updated cart JSON data
 */
function _removeCartAttributesInPage() {
  return (async () => {
    // First, get current cart to see what attributes exist
    const cartRes = await fetch('/cart.js', {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (!cartRes.ok) {
      throw new Error(`Failed to access cart (HTTP ${cartRes.status})`);
    }

    let cart;
    try {
      cart = await cartRes.json();
    } catch (parseError) {
      const contentType = cartRes.headers.get('content-type');
      throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}.`);
    }

    // If no attributes, nothing to do
    if (!cart.attributes || Object.keys(cart.attributes).length === 0) {
      throw new Error('No attributes found on cart.');
    }

    // Create update payload: set all attribute keys to empty string to remove them
    const attributesToRemove = {};
    Object.keys(cart.attributes).forEach(key => {
      attributesToRemove[key] = '';
    });

    // Update cart with empty attributes
    const updateRes = await fetch('/cart/update.js', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({ attributes: attributesToRemove })
    });

    if (!updateRes.ok) {
      throw new Error(`Failed to remove cart attributes (HTTP ${updateRes.status})`);
    }

    try {
      return await updateRes.json();
    } catch (parseError) {
      const contentType = updateRes.headers.get('content-type');
      throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}.`);
    }
  })();
}

/**
 * Gets product data from the current product page
 * Injected into page context
 * @returns {Promise<Object>} Product JSON data
 */
function _getProductInPage() {
  return (async () => {
    // Support standard and localized product URLs
    const patterns = [
      /\/products\/([^/?]+)/,
      /\/[a-z]{2}\/products\/([^/?]+)/,
      /\/collections\/[^/]+\/products\/([^/?]+)/
    ];

    let handle = null;
    for (const pattern of patterns) {
      const match = window.location.pathname.match(pattern);
      if (match) {
        handle = match[1];
        break;
      }
    }

    if (!handle) {
      throw new Error('Not on a product page. Visit a product page to use product tools.');
    }

    const res = await fetch(`/products/${handle}.js`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (!res.ok) {
      throw new Error(`Failed to access product data (HTTP ${res.status})`);
    }

    try {
      return await res.json();
    } catch (parseError) {
      const contentType = res.headers.get('content-type');
      throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}.`);
    }
  })();
}

/**
 * Logs product data to the page console
 * Injected into page context
 * @returns {Promise<Object>} Product JSON data
 */
function _logProductInPage() {
  return (async () => {
    // Support standard and localized product URLs
    const patterns = [
      /\/products\/([^/?]+)/,
      /\/[a-z]{2}\/products\/([^/?]+)/,
      /\/collections\/[^/]+\/products\/([^/?]+)/
    ];

    let handle = null;
    for (const pattern of patterns) {
      const match = window.location.pathname.match(pattern);
      if (match) {
        handle = match[1];
        break;
      }
    }

    if (!handle) {
      throw new Error('Not on a product page. Visit a product page to use product tools.');
    }

    const res = await fetch(`/products/${handle}.js`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (!res.ok) {
      throw new Error(`Failed to access product data (HTTP ${res.status})`);
    }

    let product;
    try {
      product = await res.json();
    } catch (parseError) {
      const contentType = res.headers.get('content-type');
      throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}.`);
    }

    // Log with nice formatting to the page console
    console.group('%c📦 Cart Tools for Shopify', 'font-size: 14px; font-weight: bold; color: #5C6AC4;');
    console.log('Product data:', product);
    console.log(`Title: ${product.title || 'Unknown'}`);
    console.log(`Type: ${product.type || '-'} | Vendor: ${product.vendor || '-'}`);
    console.log(`Variants: ${product.variants?.length ?? 0} | Available: ${product.available ? 'Yes' : 'No'}`);
    if (product.variants && product.variants.length > 0) {
      console.table(product.variants.map(v => ({
        title: v.title || '-',
        sku: v.sku || '-',
        price: `${v.price ? (v.price / 100).toFixed(2) : '0.00'}`,
        available: v.available ? 'Yes' : 'No',
        inventory_quantity: v.inventory_quantity ?? '-'
      })));
    }
    console.groupEnd();

    return product;
  })();
}

/**
 * Detects the current page type and available features
 * Injected into page context
 * @returns {Promise<Object>} Page context info
 */
function _detectPageContext() {
  return (async () => {
    const context = {
      isShopify: false,
      hasCart: false,
      isProductPage: false,
      productHandle: null,
      cart: null,
      error: null
    };

    // Check if cart API is available
    try {
      const cartRes = await fetch('/cart.js', {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });

      if (cartRes.ok) {
        // Try to parse as JSON - be lenient in detection
        try {
          context.cart = await cartRes.json();
          context.isShopify = true;
          context.hasCart = true;
        } catch (parseError) {
          // Not JSON, probably not a Shopify cart
          context.error = 'Cart endpoint exists but returned non-JSON response';
        }
      }
    } catch (e) {
      context.error = e.message;
    }

    // Check if on a product page - support localized URLs
    const patterns = [
      /\/products\/([^/?]+)/,
      /\/[a-z]{2}\/products\/([^/?]+)/,
      /\/collections\/[^/]+\/products\/([^/?]+)/
    ];

    for (const pattern of patterns) {
      const match = window.location.pathname.match(pattern);
      if (match) {
        context.isProductPage = true;
        context.productHandle = match[1];
        break;
      }
    }

    return context;
  })();
}

/**
 * Logs extension initialization to page console with cart summary
 * Injected into page context
 * @returns {Promise<Object>} Cart JSON data
 */
function _logInitInPage() {
  return (async () => {
    const res = await fetch('/cart.js', {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (!res.ok) {
      throw new Error(`Cannot access /cart.js (HTTP ${res.status})`);
    }

    let cart;
    try {
      cart = await res.json();
    } catch (parseError) {
      const contentType = res.headers.get('content-type');
      throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}.`);
    }

    // Fancy startup log
    console.log(
      '%c🛒 Cart Tools for Shopify %cActive',
      'font-size: 16px; font-weight: bold; color: #5C6AC4; background: #F4F5FA; padding: 8px 12px; border-radius: 4px;',
      'font-size: 12px; color: #4CAF50; font-weight: bold; margin-left: 8px;'
    );
    console.log(`%c📊 Cart snapshot: ${cart.items?.length ?? 0} item${cart.items?.length !== 1 ? 's' : ''} · ${cart.currency || 'USD'} ${cart.total_price ? (cart.total_price / 100).toFixed(2) : '0.00'}`,
      'color: #666; font-size: 12px;'
    );

    return cart;
  })();
}

/**
 * Executes a function in the page context and returns the result
 * @param {Function} func - The function to execute in the page
 * @returns {Promise<any>} The result from the function
 * @throws {Error} If execution fails or no result is returned
 */
async function runInPage(func) {
  const tabId = await getActiveTabId();
  if (!tabId) {
    throw new Error('No active tab found. Please try clicking the extension icon again.');
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func
    });

    if (result?.result === undefined) {
      // Check for common Chrome extension errors
      const err = result?.error || result?.exceptionDetails?.message || 'No result from page';

      if (err.includes('Cannot access') || err.includes('chrome://') || err.includes('chrome-extension://')) {
        throw new Error('Cannot run on this page. Chrome extensions are restricted on browser pages.');
      }

      throw new Error(err);
    }

    return result.result;
  } catch (error) {
    // Improve error messages for common scenarios
    if (error.message.includes('Cannot access')) {
      throw new Error('Cannot access this page. Try visiting a Shopify store.');
    }
    throw error;
  }
}

/**
 * Sets the status message
 * @param {string} msg - The message to display
 * @param {string} type - Message type: 'info', 'success', 'error'
 */
function setStatus(msg, type = 'info') {
  statusEl.textContent = msg;
  statusEl.className = `small ${type}`;
}

/**
 * Updates the cart summary display
 * @param {Object} cart - Cart data object
 */
function updateSummary(cart) {
  if (!cart) {
    summaryEl.textContent = '';
    return;
  }

  const itemCount = cart.item_count || 0;
  const total = cart.total_price ? (cart.total_price / 100).toFixed(2) : '0.00';
  const currency = cart.currency || 'USD';

  summaryEl.innerHTML = `
    <strong>${itemCount}</strong> item${itemCount !== 1 ? 's' : ''} &middot;
    <strong>${currency} ${total}</strong>
  `;
}

/**
 * Notifies the background worker to update the badge
 */
function notifyBadgeUpdate() {
  chrome.runtime.sendMessage({ action: 'updateBadge' }).catch(() => {
    // Ignore errors if background worker isn't ready
  });
}

/**
 * Disables all action buttons
 */
function disableButtons() {
  logBtn.disabled = true;
  copyBtn.disabled = true;
  clearBtn.disabled = true;
  removeAttrsBtn.disabled = true;
  logProductBtn.disabled = true;
  copyProductBtn.disabled = true;
}

/**
 * Enables all action buttons
 */
function enableButtons() {
  logBtn.disabled = false;
  copyBtn.disabled = false;
  clearBtn.disabled = false;
  removeAttrsBtn.disabled = false;
  logProductBtn.disabled = false;
  copyProductBtn.disabled = false;
}

/**
 * Updates UI based on page context
 * @param {Object} context - Page context from _detectPageContext
 */
function updateUIForContext(context) {
  const cartSection = document.querySelector('.section:has(#log)');
  const productSection = document.querySelector('.section:has(#log-product)');

  if (!context.isShopify) {
    // Not a Shopify site or error occurred
    let message = 'Visit a Shopify store to use this extension';

    // Provide more helpful error context if available
    if (context.error) {
      if (context.error.includes('Cannot access')) {
        message = 'Cannot access this page. Try visiting a Shopify storefront.';
      } else if (context.error.includes('chrome://')) {
        message = 'Extensions cannot run on browser pages.';
      }
    }

    summaryEl.textContent = message;
    summaryEl.className = 'summary muted';
    if (cartSection) cartSection.style.display = 'none';
    if (productSection) productSection.style.display = 'none';
    return;
  }

  // Show/hide cart section based on cart availability
  if (cartSection) {
    cartSection.style.display = context.hasCart ? 'block' : 'none';
  }

  // Show/hide product section based on whether we're on a product page
  if (productSection) {
    productSection.style.display = context.isProductPage ? 'block' : 'none';
  }

  // Update summary with cart data if available
  if (context.hasCart && context.cart) {
    updateSummary(context.cart);
  } else {
    summaryEl.textContent = context.isProductPage ? 'Product page' : 'Shopify store';
    summaryEl.className = 'summary muted';
  }
}

// Initialize: Detect page context and update UI accordingly
(async () => {
  try {
    const context = await withTimeout(runInPage(_detectPageContext), API_TIMEOUT, 'Page detection');
    updateUIForContext(context);

    // Log to console if on Shopify site
    if (context.isShopify && context.hasCart) {
      runInPage(_logInitInPage).catch(() => {
        // Ignore errors in console logging
      });
    }
  } catch (error) {
    // Provide helpful error context
    let message = 'Visit a Shopify store to use this extension';

    if (error.message) {
      if (error.message.includes('Cannot access') || error.message.includes('restricted')) {
        message = 'Cannot access this page. Try visiting a Shopify storefront.';
      } else if (error.message.includes('timed out')) {
        message = 'Page is loading slowly. Please try again.';
      }
    }

    summaryEl.textContent = message;
    summaryEl.className = 'summary muted';
  }
})();

// Log cart to console (page console, not popup console)
logBtn.addEventListener('click', async () => {
  setStatus('Reading cart…');
  const originalText = logBtn.innerHTML;
  logBtn.innerHTML = '<span class="icon">⏳</span><span>Loading…</span>';
  disableButtons();

  try {
    const cart = await withTimeout(runInPage(_logCartInPage), API_TIMEOUT, 'Reading cart');
    updateSummary(cart);
    setStatus(`Logged to page console. Items: ${cart.items?.length ?? 0}`, 'success');
  } catch (err) {
    setStatus(`Error: ${err.message || err}`, 'error');
  } finally {
    logBtn.innerHTML = originalText;
    enableButtons();
  }
});

// Copy cart JSON to clipboard
copyBtn.addEventListener('click', async () => {
  setStatus('Copying cart…');
  disableButtons();

  // Cancel any existing timeout
  if (copyCartTimeout) {
    clearTimeout(copyCartTimeout);
    copyCartTimeout = null;
  }

  try {
    const cart = await withTimeout(runInPage(_getCartInPage), API_TIMEOUT, 'Fetching cart');

    try {
      await navigator.clipboard.writeText(JSON.stringify(cart, null, 2));
    } catch (clipboardErr) {
      throw new Error('Failed to copy to clipboard. Please check permissions.');
    }

    updateSummary(cart);

    // Visual feedback: checkmark
    const iconSpan = copyBtn.querySelector('.icon');
    const originalIcon = iconSpan.textContent;
    iconSpan.textContent = '✓';
    setStatus('Cart JSON copied to clipboard.', 'success');

    copyCartTimeout = setTimeout(() => {
      iconSpan.textContent = originalIcon;
      copyCartTimeout = null;
    }, 2000);
  } catch (err) {
    setStatus(`Error: ${err.message || err}`, 'error');
  } finally {
    enableButtons();
  }
});

// Clear cart
clearBtn.addEventListener('click', async () => {
  if (!confirm('Empty the cart on this site?')) return;

  setStatus('Clearing cart…');
  const originalText = clearBtn.innerHTML;
  clearBtn.innerHTML = '<span class="icon">⏳</span><span>Clearing…</span>';
  disableButtons();

  try {
    const cart = await withTimeout(runInPage(_clearCartInPage), API_TIMEOUT, 'Clearing cart');
    updateSummary(cart);
    setStatus(`Cart cleared. Reloading page…`, 'success');

    // Update badge
    notifyBadgeUpdate();

    // Reload the page to reflect cart changes
    const tabId = await getActiveTabId();
    if (tabId) {
      chrome.tabs.reload(tabId);
    }
  } catch (err) {
    setStatus(`Error: ${err.message || err}`, 'error');
    clearBtn.innerHTML = originalText;
    enableButtons();
  }
});

// Log product to console
logProductBtn.addEventListener('click', async () => {
  setStatus('Reading product…');
  const originalText = logProductBtn.innerHTML;
  logProductBtn.innerHTML = '<span class="icon">⏳</span><span>Loading…</span>';
  disableButtons();

  try {
    const product = await withTimeout(runInPage(_logProductInPage), API_TIMEOUT, 'Reading product');
    setStatus(`Logged to console: ${product.title || 'Product'}`, 'success');
  } catch (err) {
    setStatus(`Error: ${err.message || err}`, 'error');
  } finally {
    logProductBtn.innerHTML = originalText;
    enableButtons();
  }
});

// Copy product JSON to clipboard
copyProductBtn.addEventListener('click', async () => {
  setStatus('Copying product…');
  disableButtons();

  // Cancel any existing timeout
  if (copyProductTimeout) {
    clearTimeout(copyProductTimeout);
    copyProductTimeout = null;
  }

  try {
    const product = await withTimeout(runInPage(_getProductInPage), API_TIMEOUT, 'Fetching product');

    try {
      await navigator.clipboard.writeText(JSON.stringify(product, null, 2));
    } catch (clipboardErr) {
      throw new Error('Failed to copy to clipboard. Please check permissions.');
    }

    // Visual feedback: checkmark
    const iconSpan = copyProductBtn.querySelector('.icon');
    const originalIcon = iconSpan.textContent;
    iconSpan.textContent = '✓';
    setStatus('Product JSON copied to clipboard.', 'success');

    copyProductTimeout = setTimeout(() => {
      iconSpan.textContent = originalIcon;
      copyProductTimeout = null;
    }, 2000);
  } catch (err) {
    setStatus(`Error: ${err.message || err}`, 'error');
  } finally {
    enableButtons();
  }
});

// Remove all cart attributes
removeAttrsBtn.addEventListener('click', async () => {
  if (!confirm('Remove all cart attributes?')) return;

  setStatus('Removing attributes…');
  const originalText = removeAttrsBtn.innerHTML;
  removeAttrsBtn.innerHTML = '<span class="icon">⏳</span><span>Removing…</span>';
  disableButtons();

  try {
    const cart = await withTimeout(runInPage(_removeCartAttributesInPage), API_TIMEOUT, 'Removing attributes');
    updateSummary(cart);
    setStatus('Cart attributes removed. Reloading page…', 'success');

    // Update badge
    notifyBadgeUpdate();

    // Reload the page to reflect changes
    const tabId = await getActiveTabId();
    if (tabId) {
      chrome.tabs.reload(tabId);
    }
  } catch (err) {
    setStatus(`Error: ${err.message || err}`, 'error');
    removeAttrsBtn.innerHTML = originalText;
    enableButtons();
  }
});
