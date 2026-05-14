import { initProductsTab } from './tab-products.js';

const productDataEl = document.getElementById('productData');
const promptTextEl = document.getElementById('promptText');
const videoTabBtn = document.getElementById('videoTabBtn');
const tiktokTabBtn = document.getElementById('tiktokTabBtn');
const videoTab = document.getElementById('videoTab');
const tiktokTab = document.getElementById('tiktokTab');
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

function updateUI(product) {
  productDataEl.textContent = JSON.stringify(product, null, 2);
  const prompt = buildPrompt(product);
  promptTextEl.textContent = prompt;
  currentProduct = product;
}

function sendMessageToActiveTab(message) {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return resolve(null);
      chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
        resolve(response);
      });
    });
  });
}

async function scrapeProduct() {
  const response = await sendMessageToActiveTab({ action: 'scrapeProduct' });
  if (response?.product) {
    updateUI(response.product);
  } else {
    productDataEl.textContent = 'No product data found.';
    promptTextEl.textContent = 'Scrape failed.';
  }
}

async function copyPrompt() {
  if (!currentProduct) return;
  const prompt = buildPrompt(currentProduct);
  await navigator.clipboard.writeText(prompt);
}

function openFlow() {
  chrome.runtime.sendMessage({ action: 'openFlow' });
}

function openPanel() {
  chrome.runtime.sendMessage({ action: 'openPanel' });
  window.close();
}

async function injectFlow() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  chrome.runtime.sendMessage({ action: 'injectFlowScript' });
}

videoTabBtn.addEventListener('click', () => setActiveTab('video'));
tiktokTabBtn.addEventListener('click', () => setActiveTab('tiktok'));

document.getElementById('scrape').addEventListener('click', scrapeProduct);
document.getElementById('openFlow').addEventListener('click', openFlow);
document.getElementById('openPanel').addEventListener('click', openPanel);
document.getElementById('injectFlow').addEventListener('click', injectFlow);
document.getElementById('copyPrompt').addEventListener('click', copyPrompt);

setActiveTab('video');

initProductsTab({
  showStatus(message, type = 'info') {
    const status = document.getElementById('status');
    if (status) {
      status.textContent = message;
      status.className = `status-bar status-bar--${type}`;
    }
  },
  logActivity(message, type = 'info') {
    console.log(`${type}: ${message}`);
  },
  switchTab(tabName) {
    if (tabName === 'video') {
      setActiveTab('video');
    }
  }
}).catch((error) => {
  console.error('initProductsTab error', error);
});
