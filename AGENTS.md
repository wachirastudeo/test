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
├── tab-products.html      # TikTok products tab UI
├── tab-products.js        # TikTok products tab initialization
├── tiktok-api.js          # TikTok Showcase API client
├── flow-script.js         # Injected into Flow — automates project creation
└── styles/main.css        # UI styling (design system with CSS variables)
```

## Architecture & Data Flow

```
User clicks extension icon
         ↓
Popup UI (popup.js) displays (Tabbed interface: Video | TikTok)
         ↓
[Video Tab] → User clicks "Scrape product" → content-script.js → updateUI()
[TikTok Tab] → fetchShowcaseProducts() → Render product list
         ↓
User copies prompt OR clicks "เริ่มสร้างภาพและวิดีโอบน Flow"
         ↓
background.js opens Flow tab + injects flow-script.js
         ↓
[Advanced Automation] → flow-playwright-auto.js (Separate Playwright script)
```

## Key Patterns & Conventions

### Message Passing (Extension IPC)
- **Background ↔ Popup**: Use `chrome.tabs.sendMessage()` or `chrome.runtime.sendMessage()`
- **Background ↔ Content Script**: Use `chrome.tabs.sendMessage()` with target tab ID
- **Message structure**: `{ action: 'string', payload?: object }`
- **Always return true** from `onMessage` if using async operations (Promises)

### Product Data Scraping (content-script.js)
- Scrapes using **meta tags first** (og:title, og:description, og:image), then **DOM selectors** as fallback.
- Returns object: `{ title, description, price, image, url }`
- Handles missing fields gracefully with empty strings.

### TikTok API Integration (tiktok-api.js)
- **Auth**: Requires user to be logged into `www.tiktok.com/tiktokstudio`.
- **Fetch**: Uses the `showcase/v1/list_products` endpoint.
- **Pagination**: Supports offset/count (default 20 items per page).
- **Error Handling**: 401/403 status codes trigger "Please login" messages in Thai.

### UI Design System
- **Theme**: Premium dark mode using HSL colors (primary: `260, 80%, 65%`).
- **Glassmorphism**: Subtle backgrounds with `backdrop-filter: blur(10px)`.
- **Responsive**: Flexbox/Grid layout for popup and product cards.
- **Micro-animations**: CSS transitions on hover and tab switching.

### Automation Logic (flow-script.js & flow-playwright-auto.js)
- **Injection**: `flow-script.js` is injected into `labs.google/fx/tools/flow` to automate the initial "New project" click.
- **Playwright**: `flow-playwright-auto.js` handles the complex multi-step generation flow:
    - Connecting to Chrome via Remote Debugging Port (9222).
    - Setting aspect ratios, styles (Cinematic, Anime, etc.), and motion settings.
    - Clicking the "Generate" button and tracking progress.

## Common Development Tasks

### Adding a new message action
1. Define action in `background.js` `onMessage` listener.
2. Send from popup/content-script: `chrome.tabs.sendMessage(tabId, { action: 'yourAction' })`.
3. Handle response: `.then(response => { ... })`.

### Modifying product scraping logic
- Edit `scrapeProduct()` in `content-script.js`.
- Add specific selectors for popular marketplaces (Amazon, TikTok, etc.) before the generic DOM fallback.

### Extending the TikTok Tab
- Edit `tab-products.html` for markup and `tab-products.js` for rendering logic.
- Use `tiktok-api.js` for data fetching.

## Important Notes

- **ES6 Modules**: Configured via `"type": "module"` in `manifest.json`. All imports must include file extensions (e.g., `./api.js`).
- **No localStorage**: Always use `chrome.storage.local` for persistence.
- **CSP**: No inline scripts. All events must be attached via `addEventListener` in JS files.
- **Language**: Use Thai for user-facing error messages and English for logs/docs.

## Debugging Tips

- **Service Worker**: `chrome://extensions` → Flow Product Creator → "Inspect views: service worker".
- **Playwright**: Run with `DEBUG=pw:api` to see browser interactions in real-time.
- **Remote Debugging**: Ensure Chrome is started with `--remote-debugging-port=9222`.

