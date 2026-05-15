---
name: chrome-extension-dev
description: Chrome Extension development patterns and debugging for Manifest V3
applyTo: ["chrome-flow-extension/**"]
---

# Chrome Extension Development

## Message Passing Patterns
- **Background ↔ Popup**: `chrome.runtime.sendMessage({ action: 'name', payload: data })`
- **Background ↔ Content Script**: `chrome.tabs.sendMessage(tabId, { action: 'name' })`
- **Always return true** from async `onMessage` listeners

## Common Tasks
- **Add new action**: Define in background.js `onMessage`, send from popup/content
- **Scrape data**: Meta tags first (`og:title`, `og:description`), then DOM selectors
- **Debug**: Check service worker at `chrome://extensions` → Inspect views

## File Structure
- `manifest.json`: Permissions, content scripts, service worker
- `background.js`: Tab operations, message routing
- `content-script.js`: Page scraping, DOM manipulation
- `popup.js`: UI logic, user interactions

## Debugging Commands
```bash
# Check service worker logs
chrome://extensions → Flow Product Creator → Inspect views: service worker

# Check content script logs
Right-click page → Inspect → Console (content script appears here)

# Check popup console
Right-click extension icon → Inspect popup
```

## Permissions Needed
- `activeTab`: Access current tab
- `scripting`: Inject scripts
- `storage`: Chrome storage API
- `tabs`: Tab management
- `clipboardWrite`: Copy to clipboard

## Content Security Policy
- No inline scripts in Manifest V3
- All logic in separate .js files
- Use ES6 modules with `"type": "module"` in manifest