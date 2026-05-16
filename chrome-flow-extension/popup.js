import { initProductsTab } from './tab-products.js';

const videoTabBtn = document.getElementById('videoTabBtn');
const tiktokTabBtn = document.getElementById('tiktokTabBtn');
const videoTab = document.getElementById('videoTab');
const tiktokTab = document.getElementById('tiktokTab');
const defaultPreviewImage = 'assets/icon-128.png';

function updateImageSourceUI() {
  const sourceSelect = document.getElementById('image-source-select');
  const imageInput = document.getElementById('product-image-input');
  const uploadField = document.getElementById('manual-image-upload-field');
  const usingUpload = sourceSelect.value === 'upload';

  imageInput.closest('div').hidden = usingUpload;
  uploadField.hidden = !usingUpload;
}

function setProductFields({ name = '', image = '', hasSelectedProduct = false } = {}) {
  const nameInput = document.getElementById('product-name-input');
  const imageInput = document.getElementById('product-image-input');
  const previewImg = document.getElementById('product-image-preview');
  const status = document.getElementById('selected-product-status');
  const removeBtn = document.getElementById('remove-product-btn');

  nameInput.value = name;
  imageInput.value = image;
  previewImg.src = image || defaultPreviewImage;
  status.textContent = hasSelectedProduct ? 'เลือกสินค้าจาก TikTok แล้ว' : 'ยังไม่ได้เลือกสินค้า';
  removeBtn.disabled = !hasSelectedProduct && !name && !image;
}

function setActiveTab(tabName) {
  if (tabName === 'video') {
    videoTab.classList.add('panel--active');
    tiktokTab.classList.remove('panel--active');
    videoTabBtn.classList.add('tab-button--active');
    tiktokTabBtn.classList.remove('tab-button--active');
    loadSelectedProduct();
  } else {
    videoTab.classList.remove('panel--active');
    tiktokTab.classList.add('panel--active');
    videoTabBtn.classList.remove('tab-button--active');
    tiktokTabBtn.classList.add('tab-button--active');
  }
}

async function loadSelectedProduct() {
  const { selectedProduct, manualVideoProduct } = await chrome.storage.local.get([
    'selectedProduct',
    'manualVideoProduct'
  ]);
  
  if (selectedProduct) {
    const imageUrl = selectedProduct.imageUrls?.[0] || '';
    document.getElementById('image-source-select').value = 'url';
    setProductFields({
      name: selectedProduct.name || '',
      image: imageUrl,
      hasSelectedProduct: true
    });
  } else {
    document.getElementById('image-source-select').value = manualVideoProduct?.source || 'url';
    setProductFields({
      name: manualVideoProduct?.name || '',
      image: manualVideoProduct?.image || '',
      hasSelectedProduct: false
    });
  }

  updateImageSourceUI();
}

document.getElementById('product-image-input').addEventListener('input', (e) => {
  const previewImg = document.getElementById('product-image-preview');
  previewImg.src = e.target.value || defaultPreviewImage;
  document.getElementById('remove-product-btn').disabled = !e.target.value && !document.getElementById('product-name-input').value;
});

document.getElementById('product-name-input').addEventListener('input', (e) => {
  document.getElementById('remove-product-btn').disabled = !e.target.value && !document.getElementById('product-image-input').value;
});

document.getElementById('image-source-select').addEventListener('change', () => {
  updateImageSourceUI();
});

document.getElementById('manual-image-upload').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result || '');
    document.getElementById('product-image-input').value = dataUrl;
    document.getElementById('product-image-preview').src = dataUrl || defaultPreviewImage;
    document.getElementById('remove-product-btn').disabled = false;
  };
  reader.readAsDataURL(file);
});

document.getElementById('remove-product-btn').addEventListener('click', async () => {
  await chrome.storage.local.remove(['selectedProduct', 'productQueue', 'manualVideoProduct']);
  document.getElementById('manual-image-upload').value = '';
  document.getElementById('image-source-select').value = 'url';
  setProductFields();
  updateImageSourceUI();
});

function openFlow() {
  chrome.runtime.sendMessage({ action: 'openFlow' });
}

async function generateVideo() {
  const imageStyle = document.getElementById('image-style').value;
  const imageAspectRatio = document.getElementById('image-aspect-ratio').value;
  const imagePromptExtra = document.getElementById('image-prompt-extra').value;
  const imageCount = parseInt(document.getElementById('image-count').value, 10) || 1;
  const imageStrength = parseInt(document.getElementById('image-strength').value, 10) || 80;
  const imageQuality = document.getElementById('image-quality').value;
  const videoMotion = document.getElementById('video-motion').value;
  const videoPromptExtra = document.getElementById('video-prompt-extra').value;
  const videoDuration = parseInt(document.getElementById('video-duration').value, 10) || 15;
  const videoFps = parseInt(document.getElementById('video-fps').value, 10) || 30;
  const videoTransition = document.getElementById('video-transition').value;
  const videoSoundtrack = document.getElementById('video-soundtrack').value;
  const videoOverlayText = document.getElementById('video-overlay-text').value || '';
  const autoCaption = !!document.getElementById('auto-caption').checked;
  const generateImagesFirst = !!document.getElementById('generate-images-first').checked;
  const productName = document.getElementById('product-name-input').value;
  const productImage = document.getElementById('product-image-input').value;
  const imageSource = document.getElementById('image-source-select').value;
  
  console.log('💾 Saving video settings...');
  await chrome.storage.local.set({ 
    videoSettings: { 
      imageStyle, imageAspectRatio, imagePromptExtra,
      imageCount, imageStrength, imageQuality,
      videoMotion, videoPromptExtra,
      videoDuration, videoFps, videoTransition, videoSoundtrack, videoOverlayText,
      autoCaption, generateImagesFirst,
      productName, productImage 
    },
    manualVideoProduct: { name: productName, image: productImage, source: imageSource },
    autoGenerateVideo: true  // Flag to auto-generate after opening
  });
  
  console.log('🌐 Opening Flow...');
  chrome.runtime.sendMessage({ action: 'openFlowAndGenerate' }, (response) => {
    console.log('✅ Response:', response);
  });
}

videoTabBtn.addEventListener('click', () => setActiveTab('video'));
tiktokTabBtn.addEventListener('click', () => setActiveTab('tiktok'));

document.getElementById('open-flow-btn').addEventListener('click', openFlow);
document.getElementById('generate-video-btn').addEventListener('click', generateVideo);

chrome.storage.local.get('activeTab', (data) => {
  setActiveTab(data.activeTab || 'video');
  chrome.storage.local.remove('activeTab');
});

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
    setActiveTab(tabName);
  }
}).catch((error) => {
  console.error('initProductsTab error', error);
});
