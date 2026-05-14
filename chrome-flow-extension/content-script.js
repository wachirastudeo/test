function scrapeProduct() {
  const getText = (selector) => {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim() : '';
  };

  const title =
    getText('meta[property="og:title"]') ||
    getText('meta[name="twitter:title"]') ||
    getText('h1') ||
    document.title;

  const description =
    getText('meta[property="og:description"]') ||
    getText('meta[name="description"]') ||
    getText('[itemprop="description"]') ||
    getText('p');

  const price =
    getText('[itemprop="price"]') ||
    getText('.price') ||
    getText('[class*=price]');

  const image =
    document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
    document.querySelector('img[src*="product"]')?.src ||
    document.querySelector('img')?.src ||
    '';

  return {
    title: title || '',
    description: description || '',
    price: price || '',
    image: image || '',
    url: window.location.href
  };
}

function createSidebarPanel() {
  const existing = document.getElementById('flow-extension-sidebar');
  if (existing) {
    existing.style.display = 'flex';
    return;
  }

  const style = document.createElement('style');
  style.id = 'flow-extension-sidebar-style';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    #flow-extension-sidebar {
      position: fixed;
      top: 0;
      right: 0;
      width: 420px;
      height: 100vh;
      background: #f5f5f7;
      border-left: 1px solid #e2e2e6;
      box-shadow: -8px 0 32px rgba(0,0,0,0.12);
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    
    #flow-extension-sidebar * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    /* Header */
    #flow-extension-sidebar .sidebar-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 16px 12px;
      background: #ffffff;
      border-bottom: 1px solid #e2e2e6;
      flex-shrink: 0;
    }
    
    #flow-extension-sidebar .brand {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: #2563eb;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      font-size: 20px;
      color: white;
      font-weight: 700;
    }
    
    #flow-extension-sidebar .header-text h1 {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #0f0f10;
    }
    
    #flow-extension-sidebar .header-text p {
      font-size: 12px;
      color: #9898a8;
      margin-top: 1px;
    }
    
    #flow-extension-sidebar .sidebar-close {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      border: 1px solid #e2e2e6;
      background: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 20px;
      font-weight: 400;
      line-height: 1;
      color: #5c5c6e;
      margin-left: auto;
      transition: background 0.12s;
    }
    
    #flow-extension-sidebar .sidebar-close:hover {
      background: #f5f5f7;
    }
    
    /* Tabs */
    #flow-extension-sidebar .tabs {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0;
      background: #ffffff;
      border-bottom: 1px solid #e2e2e6;
      padding: 0 16px;
      flex-shrink: 0;
    }
    
    #flow-extension-sidebar .tab-button {
      border: none;
      border-bottom: 2px solid transparent;
      border-radius: 0;
      background: transparent;
      color: #5c5c6e;
      padding: 12px 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: color 0.15s, border-color 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      width: 100%;
    }
    
    #flow-extension-sidebar .tab-button:hover {
      color: #0f0f10;
    }
    
    #flow-extension-sidebar .tab-button--active {
      color: #2563eb;
      border-bottom-color: #2563eb;
    }
    
    /* Content */
    #flow-extension-sidebar .sidebar-content {
      flex: 1;
      overflow-y: auto;
      background: #f5f5f7;
    }
    
    #flow-extension-sidebar .panel {
      display: none;
    }
    
    #flow-extension-sidebar .panel--active {
      display: block;
    }
    
    #flow-extension-sidebar .section {
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.07);
      margin: 14px 14px 0;
      overflow: hidden;
    }
    
    #flow-extension-sidebar .section__content {
      padding: 16px;
    }
    
    #flow-extension-sidebar .section-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid #e2e2e6;
    }
    
    #flow-extension-sidebar .section-header h2 {
      font-size: 14px;
      font-weight: 700;
      color: #0f0f10;
    }
    
    #flow-extension-sidebar .section-note {
      margin-top: 4px;
      color: #9898a8;
      font-size: 12px;
      line-height: 1.5;
    }
    
    /* Field */
    #flow-extension-sidebar .field {
      margin-bottom: 14px;
    }
    
    #flow-extension-sidebar .field:last-child {
      margin-bottom: 0;
    }
    
    #flow-extension-sidebar .field-label {
      display: block;
      margin-bottom: 6px;
      color: #9898a8;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    
    /* Buttons */
    #flow-extension-sidebar button {
      width: 100%;
      padding: 9px 13px;
      border-radius: 12px;
      border: 1px solid #e2e2e6;
      background: #ffffff;
      color: #0f0f10;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      transition: background 0.12s, border-color 0.12s;
      white-space: nowrap;
      font-family: inherit;
    }
    
    #flow-extension-sidebar button:hover {
      background: #f5f5f7;
      border-color: #d0d0d8;
    }
    
    #flow-extension-sidebar button.button--primary {
      background: #2563eb;
      color: #fff;
      border-color: #2563eb;
    }
    
    #flow-extension-sidebar button.button--primary:hover {
      background: #1d4ed8;
      border-color: #1d4ed8;
    }
    
    #flow-extension-sidebar .video-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    
    #flow-extension-sidebar .video-actions .button--primary {
      grid-column: 1 / -1;
    }
    
    /* Pre blocks */
    #flow-extension-sidebar pre {
      margin: 0;
      background: #f5f5f7;
      border: 1px solid #e2e2e6;
      border-radius: 12px;
      padding: 12px 14px;
      overflow-x: auto;
      font-size: 12px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
      color: #5c5c6e;
      max-height: 200px;
      overflow-y: auto;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    }
    
    /* Scrollbar */
    #flow-extension-sidebar ::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    #flow-extension-sidebar ::-webkit-scrollbar-track {
      background: transparent;
    }
    #flow-extension-sidebar ::-webkit-scrollbar-thumb {
      background: #ebebed;
      border-radius: 999px;
    }
    #flow-extension-sidebar ::-webkit-scrollbar-thumb:hover {
      background: #c0c0cc;
    }
  `;

  const sidebar = document.createElement('div');
  sidebar.id = 'flow-extension-sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="brand">F</div>
      <div class="header-text">
        <h1>Flow Product Creator</h1>
        <p>สร้างวิดีโอ + ดึงสินค้า TikTok</p>
      </div>
      <button id="flow-sidebar-close" class="sidebar-close" aria-label="Close sidebar">×</button>
    </div>
    
    <div class="tabs">
      <button id="videoTabBtn" class="tab-button tab-button--active" type="button">
        สร้างวิดีโอ
      </button>
      <button id="tiktokTabBtn" class="tab-button" type="button">
        สินค้า TikTok
      </button>
    </div>
    
    <div class="sidebar-content">
      <!-- Video Tab -->
      <div id="videoTab" class="panel panel--active">
        <section class="section">
          <div class="section__content">
            <div class="section-header">
              <div>
                <h2>Video workflow</h2>
                <p class="section-note">สกัดข้อมูลสินค้าแล้วสร้าง prompt ให้ Flow สร้างภาพหรือวิดีโอได้โดยตรง</p>
              </div>
            </div>
            
            <div class="field video-actions">
              <button id="flow-sidebar-scrape" type="button">Scrape product</button>
              <button id="flow-sidebar-open-flow" type="button">Open Flow</button>
              <button id="flow-sidebar-copy" class="button--primary" type="button">Copy Flow prompt</button>
            </div>
            
            <div class="field">
              <span class="field-label">Product data</span>
              <pre id="flow-sidebar-product">No data yet</pre>
            </div>
            <div class="field">
              <span class="field-label">Flow prompt</span>
              <pre id="flow-sidebar-prompt">Press Scrape product first</pre>
            </div>
          </div>
        </section>
      </div>
      
      <!-- TikTok Tab -->
      <div id="tiktokTab" class="panel">
        <section class="section">
          <div class="section__content">
            <div class="section-header">
              <div>
                <h2>สินค้า TikTok Showcase</h2>
                <p class="section-note">ฟีเจอร์นี้จะพร้อมใช้งานเร็วๆ นี้</p>
              </div>
            </div>
            <p style="color: #9898a8; text-align: center; padding: 32px 0;">Coming soon...</p>
          </div>
        </section>
      </div>
    </div>
  `;

  document.head.appendChild(style);
  document.body.appendChild(sidebar);
  
  // Adjust page margin
  const sidebarWidth = 420;
  document.documentElement.style.marginRight = `${sidebarWidth}px`;
  document.documentElement.style.transition = 'margin-right 0.3s ease';

  // Get elements
  const productBlock = sidebar.querySelector('#flow-sidebar-product');
  const promptBlock = sidebar.querySelector('#flow-sidebar-prompt');
  const videoTabBtn = sidebar.querySelector('#videoTabBtn');
  const tiktokTabBtn = sidebar.querySelector('#tiktokTabBtn');
  const videoTab = sidebar.querySelector('#videoTab');
  const tiktokTab = sidebar.querySelector('#tiktokTab');
  
  let currentProduct = null;

  function setActiveTab(tabName) {
    if (tabName === 'video') {
      videoTab.classList.add('panel--active');
      tiktokTab.classList.remove('panel--active');
      videoTabBtn.classList.add('tab-button--active');
      tiktokTabBtn.classList.remove('tab-button--active');
    } else {
      videoTab.classList.remove('panel--active');
      tiktokTab.classList.add('panel--active');
      videoTabBtn.classList.remove('tab-button--active');
      tiktokTabBtn.classList.add('tab-button--active');
    }
  }

  function buildPrompt(product) {
    const lines = [
      `Create a high-quality image and a short video concept for this product: ${product.title}`,
      product.description ? `Description: ${product.description}` : '',
      product.price ? `Price: ${product.price}` : '',
      `Use the product URL: ${product.url}`,
      product.image ? `Main image: ${product.image}` : ''
    ].filter(Boolean);
    return lines.join('\n');
  }

  function updateSidebar(product) {
    currentProduct = product;
    productBlock.textContent = JSON.stringify(product, null, 2);
    const prompt = buildPrompt(product);
    promptBlock.textContent = prompt;
  }

  // Event listeners
  videoTabBtn.addEventListener('click', () => setActiveTab('video'));
  tiktokTabBtn.addEventListener('click', () => setActiveTab('tiktok'));

  sidebar.querySelector('#flow-sidebar-scrape').addEventListener('click', () => {
    const product = scrapeProduct();
    updateSidebar(product);
  });

  sidebar.querySelector('#flow-sidebar-copy').addEventListener('click', () => {
    if (!currentProduct) {
      const product = scrapeProduct();
      updateSidebar(product);
    }
    const prompt = buildPrompt(currentProduct);
    navigator.clipboard.writeText(prompt).then(() => {
      const btn = sidebar.querySelector('#flow-sidebar-copy');
      const originalText = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    });
  });

  sidebar.querySelector('#flow-sidebar-open-flow').addEventListener('click', () => {
    window.open('https://labs.google/fx/tools/flow', '_blank');
  });

  sidebar.querySelector('#flow-sidebar-close').addEventListener('click', () => {
    sidebar.style.opacity = '0';
    sidebar.style.transform = 'translateX(100%)';
    sidebar.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    document.documentElement.style.marginRight = '0';
    
    setTimeout(() => {
      sidebar.remove();
      style.remove();
    }, 300);
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scrapeProduct') {
    sendResponse({ product: scrapeProduct() });
  }

  if (message.action === 'openPanel') {
    createSidebarPanel();
    sendResponse({ status: 'panel_opened' });
  }
});
