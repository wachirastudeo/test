---
name: chrome-extension-dev
description: Chrome Extension development patterns and debugging for Manifest V3 (Flow Product Creator)
applyTo: ["chrome-flow-extension/**"]
---

# Chrome Extension Development (Flow Product Creator)

## Message Passing Patterns
- **Background ↔ Popup**: `chrome.runtime.sendMessage({ action: 'name', payload: data })`
- **Background ↔ Content Script**: `chrome.tabs.sendMessage(tabId, { action: 'name' })`
- **Background ↔ Flow**: `chrome.tabs.sendMessage(flowTabId, { action: 'injectFlowScript' })`
- **Always return true** from async `onMessage` listeners to keep the channel open.

## Common Tasks
- **Add new action**: Define in `background.js` `onMessage`, send from popup/content.
- **Scrape data**: Use `scrapeProduct()` in `content-script.js`. Meta tags first, then DOM selectors.
- **TikTok API**: Use `fetchShowcaseProducts()` in `tiktok-api.js`. Requires login to TikTok Studio.
- **Automation**: `flow-script.js` handles DOM automation on Google Flow.

## Debugging Commands
```bash
# Check service worker logs
chrome://extensions → Flow Product Creator → Inspect views: service worker

# Check content script logs
Right-click page → Inspect → Console (select "Content Script" context)

# Check Playwright Automation
npm run flow:auto # Run main automation
npm run flow:explore # Explore Flow UI structure
```

## Permissions Needed
- `activeTab`: Access the current active tab.
- `scripting`: Inject `flow-script.js` or `content-script.js`.
- `storage`: Persist `videoSettings` and `productData`.
- `tabs`: Query and open new tabs (for Google Flow).
- `clipboardWrite`: Copy prompts to user clipboard.

## Manifest V3 & ES6
- **Modules**: Set `"type": "module"` in `manifest.json`.
- **Imports**: Always include `.js` extension (e.g., `import { fetch } from './api.js'`).
- **No Inline JS**: All logic must reside in external `.js` files.
- **CSP**: Ensure external APIs (like TikTok) are compatible with manifest permissions.