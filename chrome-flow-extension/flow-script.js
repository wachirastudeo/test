const delay = (ms) => new Promise(r => setTimeout(r, ms));

function findButtonByText(text) {
  const elements = Array.from(document.querySelectorAll('button, [role="button"], a, div, span'));
  return elements.find(el => {
    const content = (el.textContent || el.innerText || '').trim();
    // Support for both text and Material Icon names
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

    // Find the hidden file input
    let fileInput = document.querySelector('input[type="file"]');
    
    // If not found, try to trigger the Add Media menu first
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
  while (Date.now() - start < 20000) {
    const textbox = document.querySelector('div[role="textbox"]');
    if (textbox) return true;
    await delay(1000);
  }
  return false;
}

async function setAspectRatio(ratio = '9:16') {
  console.log(`📐 Setting aspect ratio to ${ratio}...`);
  try {
    // 1. Click the settings/model trigger to open the menu
    const trigger = document.querySelector('button:has(i[class*="crop_"])') || 
                    findButtonByText('Nano Banana Pro'); // Fallback to model name
    
    if (trigger) {
      trigger.click();
      await delay(800);

      // 2. Click the 9:16 (Portrait) button
      // The selector found was button[id$="-trigger-PORTRAIT"] or role="tab"
      const portraitBtn = document.querySelector('button[id$="-trigger-PORTRAIT"]') || 
                          findButtonByText('9:16') ||
                          Array.from(document.querySelectorAll('button[role="tab"]')).find(b => b.textContent.includes('9:16'));
      
      if (portraitBtn) {
        portraitBtn.click();
        console.log('✅ Aspect ratio set to 9:16');
        await delay(500);
        // Usually clicking the ratio might close the menu, but if not, click trigger again or elsewhere
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
    
    // Clear existing text
    textbox.innerText = '';
    
    // Use execCommand for better React/State compatibility
    document.execCommand('insertText', false, text);
    
    // Trigger events as backup
    textbox.dispatchEvent(new Event('input', { bubbles: true }));
    textbox.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('✅ Prompt filled using execCommand');
    return true;
  }
  return false;
}

async function automate() {
  const isReady = await waitForFlowReady();
  if (!isReady) {
    console.log('⚠️ Flow UI not fully loaded, proceeding carefully...');
  }
  
  await delay(2000);

  // Get settings from extension storage
  const { videoSettings, autoGenerateVideo } = await new Promise(resolve => {
    chrome.storage.local.get(['videoSettings', 'autoGenerateVideo'], resolve);
  });

  if (!videoSettings || !autoGenerateVideo) {
    console.log('ℹ️ No active generation task found');
    return;
  }

  // Clear auto flag so it doesn't run again on reload
  await chrome.storage.local.set({ autoGenerateVideo: false });

  const { productImage, productName, imagePromptExtra, imageAspectRatio = '9:16' } = videoSettings;
  console.log('🚀 Starting generation sequence...');

  try {
    // 1. Upload Image
    if (productImage) {
      const success = await uploadImageFromUrl(productImage);
      if (success) {
        console.log('⏳ Image uploaded, waiting for processing (5s)...');
        await delay(5000); // Wait longer for image processing
      }
    }

    // 2. Set Aspect Ratio
    if (imageAspectRatio === '9:16') {
      await setAspectRatio('9:16');
      await delay(1000);
    }

    // 3. Fill Prompt
    const finalPrompt = `${productName}. ${imagePromptExtra || ''}`.trim();
    const promptSuccess = await setPromptText(finalPrompt);
    if (!promptSuccess) {
      console.error('❌ Failed to fill prompt');
    }
    await delay(1000);

    // 4. Final Verification and Click Create
    const createBtn = findButtonByText('arrow_forward');
    if (createBtn) {
      // Check if image is present in the workspace before clicking
      const mediaItems = document.querySelectorAll('[data-testid*="media-item"], img[src*="blob"], video');
      console.log(`📸 Detected ${mediaItems.length} media items in workspace`);
      
      console.log('✨ Clicking Create button...');
      createBtn.click();
      console.log('🎉 Generation started!');
    } else {
      console.error('❌ Create button not found or disabled');
      // Fallback: try pressing Enter in the textbox
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

// Start automation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', automate);
} else {
  automate();
}
