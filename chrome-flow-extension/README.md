# 🚀 Flow Product Creator Chrome Extension

A premium Chrome Extension designed to bridge TikTok Showcase products and Google Flow for effortless AI-driven video content creation.

![Extension Preview](https://via.placeholder.com/800x450?text=Flow+Product+Creator+UI)

## ✨ Key Features

- **🛍️ TikTok Showcase Integration**: Directly fetch and list products from your TikTok Studio Showcase.
- **🔍 Smart Scraping**: Automatically extract product titles, descriptions, and high-quality images from any marketplace.
- **🎬 Google Flow Automation**:
    - **One-Click Project**: Auto-open Flow and initiate a "New project".
    - **Smart Injection**: Seamlessly pass product data into the Flow generation pipeline.
    - **Advanced Playwright Flow**: Full end-to-end automation for aspect ratio, style selection, and video generation.
- **🎨 Premium UI/UX**:
    - Sleek **Dark Mode** design with glassmorphism effects.
    - Tabbed interface for switching between product scraping and showcase management.
    - Real-time status indicators and smooth micro-animations.

## 🛠️ Installation

1.  **Clone/Download** this repository to your local machine.
2.  Open **Google Chrome** and navigate to `chrome://extensions`.
3.  Enable **Developer mode** (toggle in the top-right corner).
4.  Click **Load unpacked** and select the `chrome-flow-extension` directory.
5.  Pin the extension to your toolbar for easy access.

## 🚀 How to Use

### 1. Scrape from Product Page
- Open any product page (Amazon, TikTok Shop, etc.).
- Click the extension icon and stay on the **"Video"** tab.
- Press **"Scrape product"**. The extension will populate the fields automatically.
- Adjust settings (Aspect Ratio, Style, Motion) as needed.
- Click **"Copy Flow prompt"** or **"เริ่มสร้างภาพและวิดีโอบน Flow"** to automate.

### 2. Use TikTok Showcase
- Ensure you are logged into [TikTok Studio](https://www.tiktok.com/tiktokstudio).
- Switch to the **"TikTok"** tab in the extension.
- Your showcase products will load automatically.
- Click on any product to prepare it for Google Flow.

## ⚙️ Advanced Automation (Playwright)

For full hands-free generation, use the provided Playwright script:

1.  Close all Chrome instances.
2.  Launch Chrome with remote debugging:
    ```bash
    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
    ```
3.  Run the automation:
    ```bash
    npm run flow:auto
    ```

## 📜 License
ISC License - Feel free to use and modify for your own projects.
