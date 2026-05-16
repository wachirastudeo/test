# 🎬 Flow Playwright Automation Guide

## Setup

Make sure Chrome is running with remote debugging enabled:

```bash
# Kill existing Chrome
killall "Google Chrome" 2>/dev/null

# Launch Chrome with debugging on port 9222
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-flow-debug \
  --load-extension="$(pwd)/chrome-flow-extension" \
  > /dev/null 2>&1 &
```

Wait for Chrome to fully load (2-3 seconds).

## Running the Automation

### Option 1: Using npm script
```bash
npm run flow:auto
```

### Option 2: Direct node
```bash
node flow-playwright-auto.js
```

## What It Does

### 📸 MODE 1: Image Selection
1. ✅ Finds and clicks "New project" button
2. ✅ Sets product image URL
3. ✅ Clicks "Next" or "Continue" button
4. ✅ Waits for Flow interface to load

### ⚙️ MODE 2: Settings & Generation
5. ✅ Sets aspect ratio (9:16, 1:1, 16:9, 4:3)
6. ✅ Selects image style (Cinematic, Anime, 3D, etc)
7. ✅ Fills image prompt/description
8. ✅ Sets camera motion (optional)
9. ✅ Clicks "Generate" button
10. ✅ Takes screenshots for debugging

## Configuration

Settings are pulled from Chrome extension storage:
- `productImage` - URL of product image
- `productName` - Product name
- `imageAspectRatio` - 9:16, 1:1, 16:9, 4:3 (default: 9:16)
- `imageStyle` - cinematic, studio, anime, 3d, popart
- `imagePromptExtra` - Custom image description
- `videoMotion` - auto, zoom-in, zoom-out, pan-left, pan-right
- `videoPromptExtra` - Custom video description

## Debugging

The script will:
- Print button names and states to console
- Save screenshots: `flow-before-generate.png` and `flow-after-generate.png`
- Show all visible buttons if generate button is not found
- Log each step with ✅/⚠️/❌ indicators

## Troubleshooting

**Chrome won't connect:**
```bash
# Check if Chrome is running
ps aux | grep "Google Chrome"

# Check if port 9222 is open
curl http://127.0.0.1:9222/json/version
```

**Buttons not found:**
- Check the `flow-before-generate.png` screenshot
- Manually inspect the website to find button text
- Update button selectors in `flow-playwright-auto.js`

**Extension settings not loading:**
- Make sure extension is loaded with `--load-extension`
- Check that `videoSettings` are saved in Chrome storage
- Manually set values in the extension popup first

## Advanced Usage

### Set video settings before running automation:

```bash
# Open extension popup in Chrome
# Fill in product image and settings
# Click "เริ่มสร้างภาพและวิดีโอบน Flow"
# This saves settings to Chrome storage
# Then run: npm run flow:auto
```

## Console Output Example

```
🚀 Starting Flow Playwright Automation...

🔌 Connecting to Chrome DevTools Protocol...
✅ Connected to Chrome

📍 Current URL: https://labs.google/fx/tools/flow
📋 Getting video settings...
⚙️  Settings: {
  productImage: 'https://via.placeholder.com/800x800...',
  imageAspectRatio: '9:16',
  imageStyle: 'cinematic',
  ...
}

====== STARTING AUTOMATION ======

📸 MODE 1: Image Selection

1️⃣  Looking for "New project" button...
✅ Found "New project" button
✅ Clicked "New project"

2️⃣  Setting product image...
✅ Set image: https://via.placeholder.com/800x800...
...
```
