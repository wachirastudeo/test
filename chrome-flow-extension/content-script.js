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
    #flow-extension-sidebar {
      position: fixed;
      top: 0;
      right: 0;
      width: min(380px, 100vw);
      height: 100vh;
      background: rgba(255,255,255,0.98);
      border-left: 1px solid rgba(15,23,42,0.12);
      box-shadow: -20px 0 60px rgba(15,23,42,0.18);
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: Inter, system-ui, sans-serif;
    }
    #flow-extension-sidebar .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 16px;
      border-bottom: 1px solid rgba(15,23,42,0.08);
      background: rgba(255,255,255,0.96);
    }
    #flow-extension-sidebar .sidebar-title {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #111827;
    }
    #flow-extension-sidebar .sidebar-note {
      margin: 6px 0 0;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.4;
    }
    #flow-extension-sidebar .sidebar-content {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: grid;
      gap: 14px;
      background: #fff;
    }
    #flow-extension-sidebar .panel-actions {
      display: grid;
      gap: 10px;
    }
    #flow-extension-sidebar button {
      width: 100%;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid #d1d5db;
      background: #fff;
      color: #111827;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    #flow-extension-sidebar button.primary {
      background: #1d4ed8;
      color: #fff;
      border-color: transparent;
    }
    #flow-extension-sidebar .sidebar-block {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 18px;
      padding: 14px;
      font-size: 13px;
      color: #111827;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }
    #flow-extension-sidebar .sidebar-close {
      width: 34px;
      height: 34px;
      border-radius: 12px;
      border: 1px solid #d1d5db;
      background: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      font-weight: 700;
      line-height: 1;
    }
  `;

  const sidebar = document.createElement('div');
  sidebar.id = 'flow-extension-sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div>
        <p class="sidebar-title">Flow sidebar</p>
        <p class="sidebar-note">แถบด้านขวาสูงเต็มจอ พร้อมปุ่ม Close</p>
      </div>
      <button id="flow-sidebar-close" class="sidebar-close" aria-label="Close sidebar">×</button>
    </div>
    <div class="sidebar-content">
      <div class="panel-actions">
        <button id="flow-sidebar-scrape">Scrape product</button>
        <button id="flow-sidebar-copy" class="primary">Copy prompt</button>
      </div>
      <div class="sidebar-block" id="flow-sidebar-product">ยังไม่มีข้อมูลสินค้า</div>
      <div class="sidebar-block" id="flow-sidebar-prompt">กด Scrape เพื่อสร้าง prompt</div>
    </div>
  `;

  document.head.appendChild(style);
  document.body.appendChild(sidebar);
  const sidebarWidth = Math.min(380, window.innerWidth);
  document.documentElement.style.marginRight = `${sidebarWidth}px`;

  const productBlock = sidebar.querySelector('#flow-sidebar-product');
  const promptBlock = sidebar.querySelector('#flow-sidebar-prompt');

  function buildPrompt(product) {
    const lines = [
      `Create a product image and short video concept for this product: ${product.title}`,
      product.description ? `Description: ${product.description}` : '',
      product.price ? `Price: ${product.price}` : '',
      `URL: ${product.url}`,
      product.image ? `Image: ${product.image}` : ''
    ].filter(Boolean);
    return lines.join('\n');
  }

  function updateSidebar(product) {
    productBlock.textContent = `Title: ${product.title || '-'}\nPrice: ${product.price || '-'}\nURL: ${product.url || '-'}`;
    promptBlock.textContent = `Prompt:\n${buildPrompt(product)}`;
  }

  sidebar.querySelector('#flow-sidebar-scrape').addEventListener('click', () => {
    const product = scrapeProduct();
    updateSidebar(product);
  });

  sidebar.querySelector('#flow-sidebar-copy').addEventListener('click', () => {
    const product = scrapeProduct();
    const prompt = buildPrompt(product);
    navigator.clipboard.writeText(prompt);
  });

  sidebar.querySelector('#flow-sidebar-close').addEventListener('click', () => {
    sidebar.remove();
    style.remove();
    document.documentElement.style.marginRight = '';
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
