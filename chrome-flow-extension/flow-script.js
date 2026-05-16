const delay = (ms) => new Promise(r => setTimeout(r, ms));

function findButtonByText(text) {
  const elements = Array.from(document.querySelectorAll('button, [role="button"], a, div, span'));
  return elements.find(el => {
    const content = (el.textContent || el.innerText || '').trim();
    return content.toLowerCase().includes(text.toLowerCase()) ||
           (el.getAttribute('aria-label') || '').toLowerCase().includes(text.toLowerCase());
  });
}

async function uploadImageFromUrl(url) {
  console.log('🖼️ Fetching image from URL:', url);
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const fileName = url.split('/').pop() || 'product.jpg';
    const file = new File([blob], fileName, { type: blob.type });

    let fileInput = document.querySelector('input[type="file"]');

    if (!fileInput) {
      console.log('🔍 File input not found, clicking Add Media...');
      const addBtn = findButtonByText('add') || findButtonByText('Add Media');
      if (addBtn) {
        addBtn.click();
        await delay(1000);
        fileInput = document.querySelector('input[type="file"]');
      }
    }

    if (fileInput) {
      const container = new DataTransfer();
      container.items.add(file);
      fileInput.files = container.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('✅ Image file assigned to input');
      return true;
    } else {
      console.error('❌ Could not find file input even after clicking Add');
      return false;
    }
  } catch (err) {
    console.error('❌ Error uploading image:', err);
    return false;
  }
}

async function waitForFlowReady() {
  console.log('⏳ Waiting for Flow UI...');
  const start = Date.now();
  while (Date.now() - start < 30000) {
    const textbox = document.querySelector('div[role="textbox"]');
    const newProjectBtn = findButtonByText('New project') || findButtonByText('Create with Flow');

    if (textbox) {
      console.log('✅ Workspace ready');
      return 'workspace';
    }
    if (newProjectBtn) {
      console.log('✅ Dashboard detected, clicking New Project...');
      newProjectBtn.click();
      await delay(2000);
    }
    await delay(1000);
  }
  return null;
}

async function setAspectRatio(ratio = '9:16') {
  console.log(`📐 Setting aspect ratio to ${ratio}...`);
  try {
    const trigger = document.querySelector('button:has(i[class*="crop_"])') ||
                    findButtonByText('Nano Banana Pro');

    if (trigger) {
      trigger.click();
      await delay(800);

      const portraitBtn = document.querySelector('button[id$="-trigger-PORTRAIT"]') ||
                          findButtonByText('9:16') ||
                          Array.from(document.querySelectorAll('button[role="tab"]')).find(b => b.textContent.includes('9:16'));

      if (portraitBtn) {
        portraitBtn.click();
        console.log('✅ Aspect ratio set to 9:16');
        await delay(500);
      } else {
        console.error('❌ Could not find 9:16 button in menu');
      }
    } else {
      console.error('❌ Could not find settings trigger');
    }
  } catch (err) {
    console.error('❌ Error setting aspect ratio:', err);
  }
}

async function setPromptText(text) {
  const textbox = document.querySelector('div[role="textbox"]');
  if (textbox) {
    console.log('✍️ Filling prompt...');
    textbox.focus();
    textbox.innerText = '';
    document.execCommand('insertText', false, text);
    textbox.dispatchEvent(new Event('input', { bubbles: true }));
    textbox.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Prompt filled using execCommand');
    return true;
  }
  return false;
}

async function waitForMedia(timeout = 30000) {
  console.log('🔍 Waiting for media to appear in workspace...');
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const mediaItems = document.querySelectorAll('[data-testid*="media-item"], img[src*="blob"], video');
    if (mediaItems.length > 0) {
      console.log(`✅ Media detected! (${mediaItems.length} items)`);
      return true;
    }
    await delay(500);
  }
  console.log('⚠️ Timeout waiting for media, but proceeding...');
  return false;
}

async function automate() {
  const flowState = await waitForFlowReady();
  if (!flowState) {
    console.error('❌ Flow UI not ready after 30s');
    return;
  }

  await delay(2000);

  const { videoSettings, autoGenerateVideo } = await new Promise(resolve => {
    chrome.storage.local.get(['videoSettings', 'autoGenerateVideo'], resolve);
  });

  if (!videoSettings || !autoGenerateVideo) {
    console.log('ℹ️ No active generation task found');
    return;
  }

  await chrome.storage.local.set({ autoGenerateVideo: false });

  const { productImage, productName, imagePromptExtra, imageAspectRatio = '9:16' } = videoSettings;
  console.log('🚀 Starting generation for TikTok product:', productName);

  try {
    if (productImage) {
      const success = await uploadImageFromUrl(productImage);
      if (success) {
        await waitForMedia(30000);
      }
    }

    if (imageAspectRatio === '9:16') {
      await setAspectRatio('9:16');
      await delay(1000);
    }

    const finalPrompt = `${productName}. ${imagePromptExtra || ''}`.trim();
    const promptSuccess = await setPromptText(finalPrompt);
    if (!promptSuccess) {
      console.error('❌ Failed to fill prompt');
    }
    await delay(1000);

    const createBtn = findButtonByText('arrow_forward');
    if (createBtn) {
      console.log('✨ Clicking Create button...');
      createBtn.click();
      console.log('🎉 Generation started!');
    } else {
      console.error('❌ Create button not found or disabled');
      const textbox = document.querySelector('div[role="textbox"]');
      if (textbox) {
        textbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
        console.log('⌨️ Sent Enter key as fallback');
      }
    }
  } catch (error) {
    console.error('❌ Automation failed:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', automate);
} else {
  automate();
}
