/**
 * Background service worker for Shopify Cart Tools
 * Updates the extension badge with cart item count when on Shopify sites
 */

/**
 * Fetches cart data from a Shopify storefront
 * @returns {Promise<{items: Array, item_count: number}|null>} Cart data or null if not a Shopify site
 */
function _getCartInPage() {
  return (async () => {
    try {
      const res = await fetch('/cart.js', {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  })();
}

/**
 * Updates the badge for a specific tab
 * @param {number} tabId - The tab ID to update
 */
async function updateBadge(tabId) {
  try {
    // Try to execute script to get cart data
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: _getCartInPage
    });

    const cart = result?.result;

    if (cart && cart.item_count !== undefined) {
      // It's a Shopify site with a cart
      const count = cart.item_count || 0;
      await chrome.action.setBadgeText({
        tabId,
        text: count > 0 ? String(count) : ''
      });
      await chrome.action.setBadgeBackgroundColor({
        tabId,
        color: '#4CAF50'
      });
    } else {
      // Not a Shopify site or no cart API
      await chrome.action.setBadgeText({ tabId, text: '' });
    }
  } catch (err) {
    // Likely not a web page or insufficient permissions
    await chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});
  }
}

// Listen for tab activation (user switches tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await updateBadge(activeInfo.tabId);
});

// Listen for tab updates (navigation, page load)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Update when the page finishes loading (regardless of whether tab is active)
  if (changeInfo.status === 'complete') {
    await updateBadge(tabId);
  }
});

// Listen for messages from popup (when cart is modified)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateBadge') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        await updateBadge(tabs[0].id);
      }
    });
  }
});

// Update badge on extension startup for the active tab
chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs[0]) {
      await updateBadge(tabs[0].id);
    }
  });
});

// Also update when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs[0]) {
      await updateBadge(tabs[0].id);
    }
  });
});
