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
const viewSkusBtn = document.getElementById('view-skus');
const feedbackBtn = document.getElementById('feedback-btn');

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
 * Shows SKU modal in the page context
 * Injected into page context
 * @returns {Promise<string>} Success message
 */
function _showSkuModalInPage() {
  return (async () => {
    // Get product handle from URL
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
      throw new Error('Not on a product page.');
    }

    // Fetch product data
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

    // Check if modal already exists and remove it
    const existingModal = document.getElementById('shopify-cart-tools-sku-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Detect dark mode preference
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Color scheme variables
    const colors = isDarkMode ? {
      bgPrimary: '#1e1e1e',
      bgSecondary: '#2a2a2a',
      bgTertiary: '#333333',
      textPrimary: '#e8eaed',
      textSecondary: '#bdc1c6',
      textMuted: '#9aa0a6',
      border: '#3c4043',
      borderHover: '#5f6368',
      accent: '#8ab4f8',
      accentHover: '#aecbfa',
      success: '#81c995',
      error: '#f28b82',
      shadow: 'rgba(0, 0, 0, 0.5)'
    } : {
      bgPrimary: '#ffffff',
      bgSecondary: '#f8f9fa',
      bgTertiary: '#e8ecf1',
      textPrimary: '#1a1d23',
      textSecondary: '#5f6368',
      textMuted: '#9aa0a6',
      border: '#dadce0',
      borderHover: '#5f6368',
      accent: '#5C6AC4',
      accentHover: '#4c5ab8',
      success: '#0f9d58',
      error: '#d93025',
      shadow: 'rgba(0, 0, 0, 0.3)'
    };

    // Create modal HTML with inline styles
    const modalHTML = `
      <div id="shopify-cart-tools-sku-modal" style="
        all: initial;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      ">
        <div class="modal-backdrop" style="
          all: initial;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: rgba(0, 0, 0, 0.6) !important;
          backdrop-filter: blur(3px) !important;
          margin: 0 !important;
          padding: 0 !important;
        "></div>
        <div class="modal-container" style="
          all: initial;
          position: relative !important;
          background: ${colors.bgPrimary} !important;
          border-radius: 16px !important;
          box-shadow: 0 20px 60px ${colors.shadow} !important;
          width: 90% !important;
          max-width: 600px !important;
          max-height: 80vh !important;
          display: flex !important;
          flex-direction: column !important;
          border: 1px solid ${colors.border} !important;
          z-index: 1000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        ">
          <div class="modal-header" style="
            all: initial;
            padding: 20px 24px !important;
            border-bottom: 1px solid ${colors.border} !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            background: ${colors.bgSecondary} !important;
            border-radius: 16px 16px 0 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          ">
            <h3 style="
              all: initial;
              margin: 0 !important;
              padding: 0 !important;
              font-size: 18px !important;
              font-weight: 600 !important;
              color: ${colors.textPrimary} !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
              line-height: 1.2 !important;
              text-align: left !important;
              text-transform: none !important;
              letter-spacing: normal !important;
              display: block !important;
            ">Product Variants & SKUs</h3>
            <button class="modal-close-btn" style="
              all: initial;
              width: 32px !important;
              height: 32px !important;
              padding: 0 !important;
              border-radius: 50% !important;
              border: 1px solid ${colors.border} !important;
              background: ${colors.bgPrimary} !important;
              color: ${colors.textSecondary} !important;
              font-size: 24px !important;
              line-height: 1 !important;
              cursor: pointer !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              transition: all 0.15s ease !important;
              margin: 0 !important;
              box-sizing: border-box !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
              text-decoration: none !important;
              text-transform: none !important;
              letter-spacing: normal !important;
            ">×</button>
          </div>
          <div class="modal-content" style="
            all: initial;
            padding: 20px 24px !important;
            overflow-y: auto !important;
            flex: 1 !important;
            min-height: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          ">
            <div class="variant-list" style="
              all: initial;
              display: flex !important;
              flex-direction: column !important;
              gap: 12px !important;
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
            ">
              ${product.variants && product.variants.length > 0
                ? product.variants.map((variant, index) => `
                  <div class="variant-item" style="
                    all: initial;
                    background: ${colors.bgSecondary} !important;
                    border: 1px solid ${colors.border} !important;
                    border-radius: 8px !important;
                    padding: 16px !important;
                    transition: all 0.15s ease !important;
                    margin: 0 !important;
                    box-sizing: border-box !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                    display: block !important;
                  ">
                    <div style="
                      all: initial;
                      display: flex !important;
                      justify-content: space-between !important;
                      align-items: center !important;
                      gap: 12px !important;
                      margin-bottom: 12px !important;
                      margin-top: 0 !important;
                      margin-left: 0 !important;
                      margin-right: 0 !important;
                      padding: 0 !important;
                      box-sizing: border-box !important;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                    ">
                      <div style="
                        all: initial;
                        font-size: 14px !important;
                        font-weight: 600 !important;
                        color: ${colors.textPrimary} !important;
                        flex: 1 !important;
                        line-height: 1.4 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                        text-transform: none !important;
                        letter-spacing: normal !important;
                        text-align: left !important;
                        display: block !important;
                      ">${variant.title || `Variant ${index + 1}`}</div>
                      <button class="copy-sku-btn" data-sku="${variant.sku || ''}" style="
                        all: initial;
                        padding: 6px 12px !important;
                        font-size: 12px !important;
                        height: 28px !important;
                        border-radius: 6px !important;
                        background: ${colors.accent} !important;
                        border: 1px solid ${colors.accent} !important;
                        color: white !important;
                        cursor: pointer !important;
                        font-weight: 500 !important;
                        transition: all 0.15s ease !important;
                        white-space: nowrap !important;
                        margin: 0 !important;
                        box-sizing: border-box !important;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                        text-decoration: none !important;
                        text-transform: none !important;
                        letter-spacing: normal !important;
                        display: inline-block !important;
                        line-height: 1 !important;
                        text-align: center !important;
                      ">Copy</button>
                    </div>
                    <div style="
                      all: initial;
                      display: flex !important;
                      flex-direction: column !important;
                      gap: 6px !important;
                      font-size: 13px !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      box-sizing: border-box !important;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                    ">
                      <div style="all: initial; display: flex !important; gap: 12px !important; margin: 0 !important; padding: 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; align-items: baseline !important;">
                        <span style="all: initial; color: ${colors.textSecondary} !important; font-weight: 500 !important; min-width: 50px !important; font-size: 13px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1.4 !important; display: inline !important;">SKU:</span>
                        <span style="
                          all: initial;
                          color: ${colors.textPrimary} !important;
                          font-family: 'SF Mono', Monaco, 'Courier New', monospace !important;
                          word-break: break-all !important;
                          font-size: 13px !important;
                          line-height: 1.4 !important;
                          display: inline !important;
                          ${!variant.sku ? `font-style: italic !important; color: ${colors.textMuted} !important;` : ''}
                        ">${variant.sku || '(none)'}</span>
                      </div>
                      <div style="all: initial; display: flex !important; gap: 12px !important; margin: 0 !important; padding: 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; align-items: baseline !important;">
                        <span style="all: initial; color: ${colors.textSecondary} !important; font-weight: 500 !important; min-width: 50px !important; font-size: 13px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1.4 !important; display: inline !important;">Price:</span>
                        <span style="all: initial; color: ${colors.textPrimary} !important; font-family: 'SF Mono', Monaco, 'Courier New', monospace !important; font-size: 13px !important; line-height: 1.4 !important; display: inline !important;">$${variant.price ? (variant.price / 100).toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  </div>
                `).join('')
                : `<div style="all: initial; text-align: center !important; color: ${colors.textMuted} !important; padding: 48px 16px !important; font-size: 14px !important; margin: 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; display: block !important;">No variants found for this product.</div>`
              }
            </div>
          </div>
        </div>
      </div>
    `;

    // Inject modal into page
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv.firstElementChild);

    const modal = document.getElementById('shopify-cart-tools-sku-modal');

    // Add hover effects via event listeners
    const closeBtn = modal.querySelector('.modal-close-btn');
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = colors.bgTertiary;
      closeBtn.style.borderColor = colors.borderHover;
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = colors.bgPrimary;
      closeBtn.style.borderColor = colors.border;
    });

    // Add hover effects for copy buttons
    const copyButtons = modal.querySelectorAll('.copy-sku-btn');
    copyButtons.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.background = colors.accentHover;
        btn.style.transform = 'translateY(-1px)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = colors.accent;
        btn.style.transform = 'translateY(0)';
      });
    });

    // Handle copy button clicks
    copyButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const button = e.currentTarget;
        const sku = button.dataset.sku;

        if (!sku) {
          return;
        }

        const originalText = button.textContent;

        try {
          await navigator.clipboard.writeText(sku);
          button.textContent = '✓';
          button.style.background = colors.success;

          setTimeout(() => {
            button.textContent = originalText;
            button.style.background = colors.accent;
          }, 2000);
        } catch (err) {
          button.textContent = '✗';
          button.style.background = colors.error;
          setTimeout(() => {
            button.textContent = originalText;
            button.style.background = colors.accent;
          }, 2000);
        }
      });
    });

    // Handle close button click
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    // Handle backdrop click
    modal.querySelector('.modal-backdrop').addEventListener('click', () => {
      modal.remove();
    });

    // Handle ESC key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    return `Showing ${product.variants?.length || 0} variant(s)`;
  })();
}

/**
 * Shows feedback modal in the page context
 * Injected into page context
 * @returns {Promise<string>} Success message
 */
function _showFeedbackModalInPage() {
  return (async () => {
    // Check if modal already exists and remove it
    const existingModal = document.getElementById('shopify-cart-tools-feedback-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Detect dark mode preference
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Color scheme variables
    const colors = isDarkMode ? {
      bgPrimary: '#1e1e1e',
      bgSecondary: '#2a2a2a',
      bgTertiary: '#333333',
      textPrimary: '#e8eaed',
      textSecondary: '#bdc1c6',
      textMuted: '#9aa0a6',
      border: '#3c4043',
      borderHover: '#5f6368',
      accent: '#8ab4f8',
      accentHover: '#aecbfa',
      success: '#81c995',
      error: '#f28b82',
      shadow: 'rgba(0, 0, 0, 0.5)',
      inputBg: '#2a2a2a'
    } : {
      bgPrimary: '#ffffff',
      bgSecondary: '#f8f9fa',
      bgTertiary: '#e8ecf1',
      textPrimary: '#1a1d23',
      textSecondary: '#5f6368',
      textMuted: '#9aa0a6',
      border: '#dadce0',
      borderHover: '#5f6368',
      accent: '#5C6AC4',
      accentHover: '#4c5ab8',
      success: '#0f9d58',
      error: '#d93025',
      shadow: 'rgba(0, 0, 0, 0.3)',
      inputBg: '#ffffff'
    };

    // n8n webhook endpoint for feedback
    const API_ENDPOINT = 'https://n8n.lyonempire.co.uk/webhook/60d8c67b-aa73-4a1c-9e63-9987fdcb5ea7';

    // Extension metadata for webhook differentiation
    // NOTE: Update version when manifest.json version changes
    const EXTENSION_NAME = 'Cart Tools for Shopify';
    const EXTENSION_VERSION = '1.3.1';

    // Create modal HTML with form
    const modalHTML = `
      <div id="shopify-cart-tools-feedback-modal" style="
        all: initial;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      ">
        <div class="modal-backdrop" style="
          all: initial;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: rgba(0, 0, 0, 0.6) !important;
          backdrop-filter: blur(3px) !important;
          margin: 0 !important;
          padding: 0 !important;
        "></div>
        <div class="modal-container" style="
          all: initial;
          position: relative !important;
          background: ${colors.bgPrimary} !important;
          border-radius: 16px !important;
          box-shadow: 0 20px 60px ${colors.shadow} !important;
          width: 90% !important;
          max-width: 500px !important;
          max-height: 80vh !important;
          display: flex !important;
          flex-direction: column !important;
          border: 1px solid ${colors.border} !important;
          z-index: 1000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        ">
          <div class="modal-header" style="
            all: initial;
            padding: 20px 24px !important;
            border-bottom: 1px solid ${colors.border} !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            background: ${colors.bgSecondary} !important;
            border-radius: 16px 16px 0 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          ">
            <h3 style="
              all: initial;
              margin: 0 !important;
              padding: 0 !important;
              font-size: 18px !important;
              font-weight: 600 !important;
              color: ${colors.textPrimary} !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
              line-height: 1.2 !important;
              text-align: left !important;
              text-transform: none !important;
              letter-spacing: normal !important;
              display: block !important;
            ">Send Feedback</h3>
            <button class="modal-close-btn" style="
              all: initial;
              width: 32px !important;
              height: 32px !important;
              padding: 0 !important;
              border-radius: 50% !important;
              border: 1px solid ${colors.border} !important;
              background: ${colors.bgPrimary} !important;
              color: ${colors.textSecondary} !important;
              font-size: 24px !important;
              line-height: 1 !important;
              cursor: pointer !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              transition: all 0.15s ease !important;
              margin: 0 !important;
              box-sizing: border-box !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
              text-decoration: none !important;
              text-transform: none !important;
              letter-spacing: normal !important;
            ">×</button>
          </div>
          <form id="feedback-form" style="
            all: initial;
            padding: 20px 24px !important;
            overflow-y: auto !important;
            flex: 1 !important;
            min-height: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
          ">
            <div class="form-group" style="all: initial; display: flex !important; flex-direction: column !important; gap: 6px !important; margin: 0 !important; padding: 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">
              <label style="all: initial; font-size: 13px !important; font-weight: 500 !important; color: ${colors.textSecondary} !important; display: block !important; margin: 0 !important; padding: 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">Name (optional)</label>
              <input type="text" id="feedback-name" style="all: initial; width: 100% !important; padding: 10px 12px !important; border: 1px solid ${colors.border} !important; border-radius: 6px !important; background: ${colors.inputBg} !important; color: ${colors.textPrimary} !important; font-size: 14px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; box-sizing: border-box !important; display: block !important; margin: 0 !important;" />
            </div>
            <div class="form-group" style="all: initial; display: flex !important; flex-direction: column !important; gap: 6px !important; margin: 0 !important; padding: 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">
              <label style="all: initial; font-size: 13px !important; font-weight: 500 !important; color: ${colors.textSecondary} !important; display: block !important; margin: 0 !important; padding: 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">Email (optional)</label>
              <input type="email" id="feedback-email" style="all: initial; width: 100% !important; padding: 10px 12px !important; border: 1px solid ${colors.border} !important; border-radius: 6px !important; background: ${colors.inputBg} !important; color: ${colors.textPrimary} !important; font-size: 14px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; box-sizing: border-box !important; display: block !important; margin: 0 !important;" />
            </div>
            <div class="form-group" style="all: initial; display: flex !important; flex-direction: column !important; gap: 6px !important; margin: 0 !important; padding: 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">
              <label style="all: initial; font-size: 13px !important; font-weight: 500 !important; color: ${colors.textSecondary} !important; display: block !important; margin: 0 !important; padding: 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">Feedback Type</label>
              <select id="feedback-type" style="all: initial; width: 100% !important; padding: 10px 12px !important; border: 1px solid ${colors.border} !important; border-radius: 6px !important; background: ${colors.inputBg} !important; color: ${colors.textPrimary} !important; font-size: 14px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; box-sizing: border-box !important; display: block !important; margin: 0 !important; cursor: pointer !important;">
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="general">General Feedback</option>
              </select>
            </div>
            <div class="form-group" style="all: initial; display: flex !important; flex-direction: column !important; gap: 6px !important; margin: 0 !important; padding: 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">
              <label style="all: initial; font-size: 13px !important; font-weight: 500 !important; color: ${colors.textSecondary} !important; display: block !important; margin: 0 !important; padding: 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">Message <span style="all: initial; color: ${colors.error} !important; display: inline !important;">*</span></label>
              <textarea id="feedback-message" rows="5" required style="all: initial; width: 100% !important; padding: 10px 12px !important; border: 1px solid ${colors.border} !important; border-radius: 6px !important; background: ${colors.inputBg} !important; color: ${colors.textPrimary} !important; font-size: 14px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; box-sizing: border-box !important; display: block !important; margin: 0 !important; resize: vertical !important; min-height: 100px !important;"></textarea>
            </div>
            <div class="form-status" id="form-status" style="all: initial; font-size: 13px !important; padding: 8px 12px !important; border-radius: 6px !important; display: none !important; margin: 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; text-align: center !important;"></div>
            <div style="all: initial; display: flex !important; gap: 8px !important; margin: 0 !important; padding: 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;">
              <button type="button" class="cancel-btn" style="
                all: initial;
                flex: 1 !important;
                padding: 10px 16px !important;
                border-radius: 6px !important;
                border: 1px solid ${colors.border} !important;
                background: ${colors.bgPrimary} !important;
                color: ${colors.textSecondary} !important;
                cursor: pointer !important;
                font-size: 14px !important;
                font-weight: 500 !important;
                transition: all 0.15s ease !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                margin: 0 !important;
                box-sizing: border-box !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                text-decoration: none !important;
                text-transform: none !important;
                letter-spacing: normal !important;
              ">Cancel</button>
              <button type="submit" class="submit-btn" style="
                all: initial;
                flex: 1 !important;
                padding: 10px 16px !important;
                border-radius: 6px !important;
                border: 1px solid ${colors.accent} !important;
                background: ${colors.accent} !important;
                color: white !important;
                cursor: pointer !important;
                font-size: 14px !important;
                font-weight: 500 !important;
                transition: all 0.15s ease !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                margin: 0 !important;
                box-sizing: border-box !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                text-decoration: none !important;
                text-transform: none !important;
                letter-spacing: normal !important;
              ">Send Feedback</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Inject modal into page
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv.firstElementChild);

    const modal = document.getElementById('shopify-cart-tools-feedback-modal');
    const form = document.getElementById('feedback-form');
    const formStatus = document.getElementById('form-status');

    // Add hover effects
    const closeBtn = modal.querySelector('.modal-close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const submitBtn = modal.querySelector('.submit-btn');

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = colors.bgTertiary;
      closeBtn.style.borderColor = colors.borderHover;
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = colors.bgPrimary;
      closeBtn.style.borderColor = colors.border;
    });

    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.background = colors.bgSecondary;
      cancelBtn.style.borderColor = colors.borderHover;
    });
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.background = colors.bgPrimary;
      cancelBtn.style.borderColor = colors.border;
    });

    submitBtn.addEventListener('mouseenter', () => {
      submitBtn.style.background = colors.accentHover;
      submitBtn.style.borderColor = colors.accentHover;
    });
    submitBtn.addEventListener('mouseleave', () => {
      submitBtn.style.background = colors.accent;
      submitBtn.style.borderColor = colors.accent;
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('feedback-name').value.trim();
      const email = document.getElementById('feedback-email').value.trim();
      const type = document.getElementById('feedback-type').value;
      const message = document.getElementById('feedback-message').value.trim();

      if (!message) {
        formStatus.textContent = 'Please enter a message';
        formStatus.style.display = 'block';
        formStatus.style.background = colors.error + '20';
        formStatus.style.color = colors.error;
        return;
      }

      // Disable submit button
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
      submitBtn.style.cursor = 'not-allowed';
      submitBtn.textContent = 'Sending...';

      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            // Extension identification
            extension_name: EXTENSION_NAME,
            extension_version: EXTENSION_VERSION,
            // User feedback
            name: name || 'Anonymous',
            email: email || 'Not provided',
            type,
            message,
            // Context metadata
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Success
        formStatus.textContent = 'Thank you! Your feedback has been sent.';
        formStatus.style.display = 'block';
        formStatus.style.background = colors.success + '20';
        formStatus.style.color = colors.success;

        // Clear form
        form.reset();

        // Close modal after 2 seconds
        setTimeout(() => {
          modal.remove();
        }, 2000);
      } catch (error) {
        formStatus.textContent = 'Failed to send feedback. Please try again.';
        formStatus.style.display = 'block';
        formStatus.style.background = colors.error + '20';
        formStatus.style.color = colors.error;

        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        submitBtn.textContent = 'Send Feedback';
      }
    });

    // Handle close button click
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    // Handle cancel button click
    cancelBtn.addEventListener('click', () => {
      modal.remove();
    });

    // Handle backdrop click
    modal.querySelector('.modal-backdrop').addEventListener('click', () => {
      modal.remove();
    });

    // Handle ESC key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    return 'Feedback modal opened';
  })();
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
  viewSkusBtn.disabled = true;
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
  viewSkusBtn.disabled = false;
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

// View product SKUs in modal
viewSkusBtn.addEventListener('click', async () => {
  setStatus('Loading variants…');
  const originalText = viewSkusBtn.innerHTML;
  viewSkusBtn.innerHTML = '<span class="icon">⏳</span><span>Loading…</span>';
  disableButtons();

  try {
    const message = await withTimeout(runInPage(_showSkuModalInPage), API_TIMEOUT, 'Loading SKU modal');
    setStatus(message, 'success');

    // Close the popup so user can interact with modal immediately
    setTimeout(() => window.close(), 100);
  } catch (err) {
    setStatus(`Error: ${err.message || err}`, 'error');
    viewSkusBtn.innerHTML = originalText;
    enableButtons();
  }
});

// Open feedback modal
feedbackBtn.addEventListener('click', async () => {
  try {
    await runInPage(_showFeedbackModalInPage);
    // Close the popup so user can interact with modal immediately
    setTimeout(() => window.close(), 100);
  } catch (err) {
    setStatus(`Error: ${err.message || err}`, 'error');
  }
});
