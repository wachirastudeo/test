#!/bin/bash

# 🚀 Launch Chrome with remote debugging for Flow automation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="$SCRIPT_DIR/chrome-flow-extension"

echo "🧹 Killing existing Chrome processes..."
killall "Google Chrome" 2>/dev/null
sleep 2

echo "✅ Chrome closed"
echo ""
echo "🌐 Launching Chrome with remote debugging..."
echo "   Port: 9222"
echo "   Profile: /tmp/chrome-flow-debug"
echo ""

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-flow-debug \
  --load-extension="$EXTENSION_DIR" \
  > /dev/null 2>&1 &

CHROME_PID=$!
echo "✅ Chrome launched (PID: $CHROME_PID)"
echo ""
echo "⏳ Waiting for Chrome to fully load..."
sleep 3

# Check if debugging port is open
if curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
  echo "✅ Chrome debugging port is ready!"
  echo ""
  echo "📝 Next steps:"
  echo "   1. Log in to Google in the Chrome window"
  echo "   2. Navigate to: https://labs.google/fx/tools/flow"
  echo "   3. Fill in extension settings (product image, style, etc)"
  echo "   4. Run: npm run flow:auto"
  echo ""
  echo "💡 To keep Chrome running in background, you can close this terminal"
else
  echo "❌ Chrome debugging port not responding"
  echo "   Waiting 2 more seconds..."
  sleep 2
  
  if curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
    echo "✅ Port is now ready!"
  else
    echo "⚠️  Port still not responding. Check if Chrome is running:"
    echo "   ps aux | grep Chrome"
  fi
fi
