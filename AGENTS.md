# Flow Product Creator Chrome Extension — Agent Guide

This is a Chrome Extension (Manifest V3) that scrapes product details from web pages and helps create prompts for Google Flow image/video generation. See [README.md](chrome-flow-extension/README.md) for user documentation.

## Project Structure

```
chrome-flow-extension/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Service worker — handles tab/Flow operations
├── content-script.js      # Injected into pages — scrapes product data & UI
├── popup.js               # Popup UI logic — main user interface
├── popup.html             # Popup UI markup
├── flow-script.js         # Injected into Flow — automates project creation
├── tab-products.js        # TikTok products tab initialization
├── tiktok-api.js          # TikTok Showcase API client
└── styles/main.css        # UI styling (design system with CSS variables)
```

## Architecture & Data Flow

```
User clicks extension icon
         ↓
Popup UI (popup.js) displays
         ↓
User clicks "Scrape product" button
         ↓
chrome.tabs.sendMessage → Content script (content-script.js)
         ↓
Content script scrapes product data using DOM selectors
         ↓
Response sent back to popup → updateUI() displays data
         ↓
User copies prompt or clicks "Click New project"
         ↓
background.js opens Flow tab + injects flow-script.js
```

## Key Patterns & Conventions

### Message Passing (Extension IPC)
- **Background ↔ Popup**: Use `chrome.tabs.sendMessage()` or `chrome.runtime.sendMessage()`
- **Background ↔ Content Script**: Use `chrome.tabs.sendMessage()` with target tab ID
- **Message structure**: `{ action: 'string', payload?: object }`
- **Always return true** from `onMessage` if using async operations (Promises)
- Example:
  ```js
  // In background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openFlow') {
      chrome.tabs.create({ url: 'https://labs.google/fx/tools/flow' });
      sendResponse({ status: 'opened' });
    }
    return true; // Enable async sendResponse
  });
  ```

### Product Data Scraping (content-script.js)
- Scrapes using **meta tags first** (og:title, og:description, og:image), then **DOM selectors** as fallback
- Returns object: `{ title, description, price, image, url }`
- Handles missing fields gracefully with empty strings
- Note: Meta tag scraping is more reliable than DOM parsing for most e-commerce sites

### Prompt Building
- Located in `popup.js` → `buildPrompt(product)` function
- Multiline format with product details + URL + image reference
- Used by users to copy-paste into Google Flow

### UI Patterns
- **Tabbed interface**: Video tab (Flow generation) vs TikTok tab (Showcase products)
- **Tab switching**: `setActiveTab('video' | 'tiktok')` with class toggling
- **Design system**: CSS variables in `styles/main.css` (colors, spacing, shadows)

### TikTok API Integration (tiktok-api.js)
- Requires user to be logged into `www.tiktok.com/tiktokstudio`
- Fetches showcase products with pagination (offset/count parameters)
- Error handling for auth failures (401/403 → user-friendly Thai error messages)
- Note: Uses Thai language error messages (ดึง = fetch/pull, กรุณา = please)

## Common Development Tasks

### Adding a new message action
1. Define action in background.js `onMessage` listener
2. Send from popup/content-script: `chrome.tabs.sendMessage(tabId, { action: 'yourAction' })`
3. Handle response: `.then(response => { ... })`

### Modifying product scraping logic
- Edit the `scrapeProduct()` function in content-script.js
- Add new selectors before DOM fallbacks for better coverage
- Test on various product pages to ensure selector robustness

### Extending the popup UI
- Edit `popup.html` for markup
- Edit `popup.js` for logic and event listeners
- Import additional modules as needed using ES6 `import`

### Automating Flow interactions
- Logic in `flow-script.js` (injected into Flow tab)
- Current behavior: Clicks Flow's "New project" button automatically
- Modify the DOM selectors/actions to fit any Flow UI changes

## Important Notes

- **ES6 Modules**: All `.js` files use ES6 `import`/`export` (configured in manifest.json `"type": "module"`)
- **No localStorage**: Uses Chrome storage API via permissions in manifest
- **Content Security Policy**: Manifest v3 restricts inline scripts — all logic must be in separate files
- **Permissions**: activeTab, scripting, storage, tabs, clipboardWrite (needed for copy-to-clipboard)
- **Thai/English mixed**: Codebase has Thai comments and error messages — maintain this convention for internationalization

## Files to Know

| File | Purpose | Key Functions |
|------|---------|---|
| `background.js` | Service worker | `onMessage` listeners for openFlow, openPanel, injectFlowScript, fetchProducts |
| `content-script.js` | Page injection | `scrapeProduct()`, `createSidebarPanel()` |
| `popup.js` | UI logic | `updateUI()`, `buildPrompt()`, `setActiveTab()` |
| `tiktok-api.js` | API client | `fetchShowcaseProducts(options)` |
| `tab-products.js` | TikTok tab init | `initProductsTab()` |
| `flow-script.js` | Flow automation | Auto-click "New project" button |

## Debugging Tips

- Check **DevTools for service worker**: `chrome://extensions` → Flow Product Creator → "Inspect views: service worker"
- Check **content script**: Right-click page → Inspect → Console (content script logs appear here)
- Check **popup console**: Right-click extension icon → Inspect popup
- **Message passing failures**: Ensure tab IDs are correct and content script is loaded (run_at: document_idle)
