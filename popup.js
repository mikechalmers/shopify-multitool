/**
 * Cart Tools for Shopify - Popup Script
 * Main logic for the extension popup UI
 */

const statusEl = document.getElementById('status');
const summaryEl = document.getElementById('summary');
const logBtn = document.getElementById('log');
const copyBtn = document.getElementById('copy');
const clearBtn = document.getElementById('clear');
const logProductBtn = document.getElementById('log-product');
const copyProductBtn = document.getElementById('copy-product');

const API_TIMEOUT = 10000; // 10 seconds

/**
 * Gets the active tab ID
 * @returns {Promise<number|undefined>} The active tab ID or undefined
 */
async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

/**
 * Adds a timeout to a promise
 * @param {Promise} promise - The promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise} The promise with timeout
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
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
    if (!res.ok) throw new Error('Unable to access cart. Please ensure you\'re on a Shopify storefront with AJAX Cart API enabled.');
    return await res.json();
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
    if (!res.ok) throw new Error('Unable to access cart. Please ensure you\'re on a Shopify storefront with AJAX Cart API enabled.');
    const cart = await res.json();

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
    if (!res.ok) throw new Error('Failed to clear cart. Please try again or reload the page.');
    return await res.json();
  })();
}

/**
 * Gets product data from the current product page
 * Injected into page context
 * @returns {Promise<Object>} Product JSON data
 */
function _getProductInPage() {
  return (async () => {
    // Try to extract product handle from URL or meta tags
    const pathMatch = window.location.pathname.match(/\/products\/([^/?]+)/);
    const handle = pathMatch?.[1];

    if (!handle) {
      throw new Error('Not on a product page. Visit a product page to use product tools.');
    }

    const res = await fetch(`/products/${handle}.js`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (!res.ok) throw new Error('Unable to access product data. Please ensure you\'re on a Shopify product page.');
    return await res.json();
  })();
}

/**
 * Logs product data to the page console
 * Injected into page context
 * @returns {Promise<Object>} Product JSON data
 */
function _logProductInPage() {
  return (async () => {
    const pathMatch = window.location.pathname.match(/\/products\/([^/?]+)/);
    const handle = pathMatch?.[1];

    if (!handle) {
      throw new Error('Not on a product page. Visit a product page to use product tools.');
    }

    const res = await fetch(`/products/${handle}.js`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (!res.ok) throw new Error('Unable to access product data. Please ensure you\'re on a Shopify product page.');
    const product = await res.json();

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
      cart: null
    };

    // Check if cart API is available
    try {
      const cartRes = await fetch('/cart.js', {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });
      if (cartRes.ok) {
        context.isShopify = true;
        context.hasCart = true;
        context.cart = await cartRes.json();
      }
    } catch (e) {
      // Not a Shopify site or cart unavailable
    }

    // Check if on a product page
    const pathMatch = window.location.pathname.match(/\/products\/([^/?]+)/);
    if (pathMatch) {
      context.isProductPage = true;
      context.productHandle = pathMatch[1];
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
    if (!res.ok) throw new Error('Cannot access /cart.js');
    const cart = await res.json();

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
  if (!tabId) throw new Error('No active tab.');

  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func
  });

  if (result?.result === undefined) {
    const err = result?.error || result?.exceptionDetails?.message || 'No result from page.';
    throw new Error(err);
  }

  return result.result;
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
    // Not a Shopify site
    summaryEl.textContent = 'Visit a Shopify store to use this extension';
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
    const context = await withTimeout(runInPage(_detectPageContext), API_TIMEOUT);
    updateUIForContext(context);

    // Log to console if on Shopify site
    if (context.isShopify && context.hasCart) {
      runInPage(_logInitInPage).catch(() => {
        // Ignore errors in console logging
      });
    }
  } catch {
    // Silently fail - not a Shopify site or unavailable
    summaryEl.textContent = 'Visit a Shopify store to use this extension';
    summaryEl.className = 'summary muted';
  }
})();

// Log cart to console (page console, not popup console)
logBtn.addEventListener('click', async () => {
  setStatus('Reading cart…');
  disableButtons();

  try {
    const cart = await withTimeout(runInPage(_logCartInPage), API_TIMEOUT);
    updateSummary(cart);
    setStatus(`Logged to page console. Items: ${cart.items?.length ?? 0}`, 'success');
  } catch (err) {
    setStatus(`Error: ${err.message || err}`, 'error');
  } finally {
    enableButtons();
  }
});

// Copy cart JSON to clipboard
copyBtn.addEventListener('click', async () => {
  setStatus('Copying cart…');
  disableButtons();

  try {
    const cart = await withTimeout(runInPage(_getCartInPage), API_TIMEOUT);
    await navigator.clipboard.writeText(JSON.stringify(cart, null, 2));
    updateSummary(cart);

    // Visual feedback: checkmark
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓ Copied!';
    setStatus('Cart JSON copied to clipboard.', 'success');

    setTimeout(() => {
      copyBtn.textContent = originalText;
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
  disableButtons();

  try {
    const cart = await withTimeout(runInPage(_clearCartInPage), API_TIMEOUT);
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
    enableButtons();
  }
});

// Log product to console
logProductBtn.addEventListener('click', async () => {
  setStatus('Reading product…');
  disableButtons();

  try {
    const product = await withTimeout(runInPage(_logProductInPage), API_TIMEOUT);
    setStatus(`Logged to console: ${product.title || 'Product'}`, 'success');
  } catch (err) {
    setStatus(`Error: ${err.message || err}`, 'error');
  } finally {
    enableButtons();
  }
});

// Copy product JSON to clipboard
copyProductBtn.addEventListener('click', async () => {
  setStatus('Copying product…');
  disableButtons();

  try {
    const product = await withTimeout(runInPage(_getProductInPage), API_TIMEOUT);
    await navigator.clipboard.writeText(JSON.stringify(product, null, 2));

    // Visual feedback: checkmark
    const originalText = copyProductBtn.textContent;
    copyProductBtn.textContent = '✓ Copied!';
    setStatus('Product JSON copied to clipboard.', 'success');

    setTimeout(() => {
      copyProductBtn.textContent = originalText;
    }, 2000);
  } catch (err) {
    setStatus(`Error: ${err.message || err}`, 'error');
  } finally {
    enableButtons();
  }
});
