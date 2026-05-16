# 🎬 Flow Playwright Automation Guide

This guide covers how to run and debug the end-to-end automation for Google Flow using Playwright.

## 🛠️ Setup

Playwright requires a running instance of Chrome with **Remote Debugging** enabled.

### MacOS
```bash
# 1. Kill existing Chrome processes
killall "Google Chrome" 2>/dev/null

# 2. Launch Chrome with debugging port 9222
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-flow-debug \
  --load-extension="$(pwd)/chrome-flow-extension" \
  > /dev/null 2>&1 &
```

### Windows (PowerShell)
```powershell
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--remote-debugging-port=9222 --user-data-dir=$env:TEMP\chrome-flow-debug --load-extension=$(Get-Location)\chrome-flow-extension"
```

## 🚀 Running the Automation

### Main Generation Flow
This script pulls settings from the extension's storage and performs the full generation.
```bash
npm run flow:auto
```

### 🔍 UI Exploration & Debugging
If the Flow UI changes, use the explorer script to dump the current page structure and find new selectors.
```bash
npm run flow:explore
```

## ⚙️ How It Works

### Phase 1: Project Initialization
1.  Connects to Chrome via WebSocket (`ws://127.0.0.1:9222`).
2.  Finds the "New project" button and clicks it.
3.  Injects the **Product Image URL** into the upload field.

### Phase 2: Configuration
4.  **Aspect Ratio**: Sets 9:16 (Vertical), 1:1 (Square), etc.
5.  **Style**: Applies Cinematic, Studio, Anime, 3D, or Pop Art styles.
6.  **Prompts**: Fills the image and video description fields.

### Phase 3: Generation & Verification
7.  Clicks the **"Generate"** button.
8.  Waits for the progress indicator to complete.
9.  Takes debugging screenshots: `flow-before-generate.png` and `flow-after-generate.png`.

## 🛠️ Troubleshooting

### ❌ "Could not connect to Chrome"
- Check if Chrome is actually running: `ps aux | grep "Google Chrome"`
- Verify the port: `curl http://127.0.0.1:9222/json/version`
- Ensure no other process is using port 9222.

### ❌ "Button not found"
The Google Flow UI uses dynamic classes. The automation relies on **ARIA labels** and **Text content**.
- Run `npm run flow:explore` to see what buttons Playwright can "see".
- Check `flow-before-generate.png` to see where the script got stuck.

### ⚠️ "Extension settings not loading"
- Open the extension popup in the debug Chrome instance.
- Ensure you've clicked **"เริ่มสร้างภาพและวิดีโอบน Flow"** at least once to save settings to storage.

## 📁 Key Files
- `flow-playwright-auto.js`: The main automation logic.
- `explore-flow.js`: Debugging tool for UI inspection.
- `launch-chrome.sh`: Helper script to launch Chrome with correct flags.
