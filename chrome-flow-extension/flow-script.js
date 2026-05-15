const delay = (ms) => new Promise(r => setTimeout(r, ms));

function findButtonByText(text) {
  const elements = Array.from(document.querySelectorAll('button, [role="button"], a, div, span'));
  return elements.find(el => {
    const content = (el.textContent || el.innerText || '').trim();
    return content.toLowerCase().includes(text.toLowerCase()) || 
           (el.getAttribute('aria-label') || '').toLowerCase().includes(text.toLowerCase());
  });
}

function findInputByPlaceholder(text) {
  return Array.from(document.querySelectorAll('input, textarea')).find(el => {
    const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
    return placeholder.includes(text.toLowerCase());
  });
}

async function waitForButtons(timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const btns = document.querySelectorAll('button');
    if (btns.length > 0) return btns.length;
    await delay(500);
  }
  return 0;
}

async function waitForFlowReady() {
  console.log('⏳ Waiting for Flow to be ready...');
  const count = await waitForButtons(20000);
  if (count > 0) {
    console.log(`✅ Flow ready! Found ${count} buttons`);
    return true;
  }
  console.log('⚠️ No buttons found after 20s, proceeding anyway...');
  return false;
}

async function automate() {
  // Wait for Flow DOM to be fully rendered first
  await waitForFlowReady();
  await delay(1000);
  
  console.log('🚀 Image Generation Starting...');
  
  // Get settings from extension storage
  const { videoSettings, autoGenerateVideo } = await new Promise(resolve => {
    chrome.storage.local.get(['videoSettings', 'autoGenerateVideo'], resolve);
  });

  if (!videoSettings || !autoGenerateVideo) {
    console.log('⚠️ No video settings or auto flag found');
    return;
  }

  const { 
    productImage, 
    productName,
    imageAspectRatio = '9:16', 
    imageStyle = 'cinematic', 
    imagePromptExtra,
  } = videoSettings;

  console.log('📋 Image Generation Settings:', { 
    productName, 
    imageAspectRatio, 
    imageStyle,
    imagePromptExtra 
  });

  try {
    // ===== STAGE 1: IMAGE GENERATION =====
    console.log('\n╔════════════════════════════════════╗');
    console.log('║    STAGE 1: IMAGE GENERATION      ║');
    console.log('╚════════════════════════════════════╝\n');

    // ===== STEP 1: Click "Add Media" or find upload area =====
    console.log('1️⃣ Looking for upload/add media button...');
    let addBtn = findButtonByText('Add Media') || 
                 findButtonByText('Add') ||
                 findButtonByText('Upload');
    
    if (addBtn && !addBtn.disabled) {
      addBtn.click();
      console.log('✅ Clicked upload button');
      await delay(1500);
    } else {
      console.log('⚠️ Upload button not found, trying alternative method');
    }

    // ===== STEP 2: Fill Image URL =====
    if (productImage) {
      console.log('\n2️⃣ Filling image URL...');
      const imageInput = Array.from(document.querySelectorAll('input[type="text"], input[type="url"]'))
        .find(inp => {
          const placeholder = (inp.getAttribute('placeholder') || '').toLowerCase();
          const value = inp.value || '';
          const visible = inp.offsetParent !== null;
          return visible && (
            placeholder.includes('image') || 
            placeholder.includes('url') ||
            placeholder.includes('upload') ||
            value === ''
          );
        });

      if (imageInput) {
        console.log('   🔗 Found image input field');
        imageInput.focus();
        imageInput.value = productImage;
        imageInput.dispatchEvent(new Event('input', { bubbles: true }));
        imageInput.dispatchEvent(new Event('change', { bubbles: true }));
        imageInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        console.log(`✅ Image URL filled: ${productImage.substring(0, 50)}...`);
        await delay(1500);
      } else {
        console.log('⚠️ Image input not found');
      }
    }

    // ===== STEP 3: Click Next/Continue to settings =====
    console.log('\n3️⃣ Looking for "Next" or "Continue" button...');
    let nextBtn = findButtonByText('Next') || 
                  findButtonByText('Continue') || 
                  findButtonByText('Confirm') ||
                  findButtonByText('Next Step');
    
    if (nextBtn && !nextBtn.disabled) {
      nextBtn.click();
      console.log('✅ Proceeding to settings screen');
      await delay(2000);
    } else {
      console.log('⚠️ Next button not found, may be auto-proceeding');
      await delay(1500);
    }

    // ===== STEP 4: Set Aspect Ratio 9:16 =====
    console.log(`\n4️⃣ Setting aspect ratio to ${imageAspectRatio}...`);
    const aspectBtn = findButtonByText(imageAspectRatio) || 
                      findButtonByText('9:16') ||
                      findButtonByText('Portrait');
    
    if (aspectBtn && !aspectBtn.disabled) {
      aspectBtn.click();
      console.log(`✅ Aspect ratio set to ${imageAspectRatio}`);
      await delay(800);
    } else {
      console.log('⚠️ Aspect ratio button not found');
    }

    // ===== STEP 5: Set Image Style =====
    console.log(`\n5️⃣ Setting image style to "${imageStyle}"...`);
    const selects = Array.from(document.querySelectorAll('select'));
    if (selects.length > 0) {
      const styleSelect = selects[0];
      const options = Array.from(styleSelect.querySelectorAll('option'));
      const matchOption = options.find(opt => 
        opt.value === imageStyle || 
        opt.textContent.toLowerCase().includes(imageStyle.toLowerCase())
      );
      
      if (matchOption) {
        styleSelect.value = matchOption.value;
        styleSelect.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`✅ Image style set to "${imageStyle}"`);
        await delay(500);
      } else {
        console.log(`⚠️ Style "${imageStyle}" not found in options`);
      }
    }

    // ===== STEP 6: Fill Image Prompt/Description =====
    if (imagePromptExtra) {
      console.log('\n6️⃣ Filling image prompt/description...');
      const textareas = Array.from(document.querySelectorAll('textarea'));
      if (textareas.length > 0) {
        const promptTA = textareas[0];
        promptTA.focus();
        promptTA.value = imagePromptExtra;
        promptTA.dispatchEvent(new Event('input', { bubbles: true }));
        promptTA.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`✅ Prompt filled: "${imagePromptExtra}"`);
        await delay(800);
      } else {
        console.log('⚠️ Prompt textarea not found');
      }
    }

    // ===== STEP 7: Click Generate Image Button =====
    console.log('\n7️⃣ Looking for Generate Image button...');
    let genBtn = findButtonByText('Generate') || 
                 findButtonByText('Generate Image') ||
                 findButtonByText('Create Image') ||
                 findButtonByText('Make') ||
                 findButtonByText('Start');
    
    if (genBtn && !genBtn.disabled) {
      console.log('✅ Found Generate button');
      await delay(500);
      genBtn.click();
      console.log('\n🎨 IMAGE GENERATION STARTED! 🖼️');
      console.log('   ⏳ Generating image with settings:');
      console.log(`   - Aspect Ratio: ${imageAspectRatio}`);
      console.log(`   - Style: ${imageStyle}`);
      console.log(`   - Prompt: ${imagePromptExtra}`);
    } else {
      console.log('❌ Generate button not found or disabled');
      const allBtns = Array.from(document.querySelectorAll('button'))
        .map(b => ({
          text: b.textContent?.trim(),
          disabled: b.disabled
        }))
        .filter(b => b.text && b.text.length < 50 && b.text.length > 0);
      console.log('   Available buttons:', allBtns.slice(0, 10));
    }

    // Wait for generation to complete (show progress)
    console.log('\n⏳ Waiting for image generation to complete...');
    for (let i = 0; i < 12; i++) {
      await delay(2500);
      const loadingIndicator = document.querySelector('[aria-busy="true"], .loading, [role="progressbar"]');
      if (!loadingIndicator) {
        console.log('✅ Generation complete!');
        break;
      }
      console.log(`   ${i + 1}. Still generating...`);
    }

    await delay(2000);
    console.log('\n╔════════════════════════════════════╗');
    console.log('║  ✅ STAGE 1 COMPLETE: IMAGE READY ║');
    console.log('╚════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Start automation when DOM is ready
console.log('📌 Flow script loaded');
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📌 DOMContentLoaded, starting...');
    automate();
  });
} else {
  console.log('📌 DOM already ready, starting...');
  automate();
}
