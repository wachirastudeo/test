const { chromium } = require('playwright');
const path = require('path');

const FLOW_URL = 'https://labs.google/fx/tools/flow';
const CDP_URL = 'http://127.0.0.1:9222';
const EXTENSION_DIR = path.join(__dirname, 'chrome-flow-extension');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🚀 Starting Flow Playwright Automation...\n');

  let browser;
  try {
    // Connect to running Chrome instance
    console.log('🔌 Connecting to Chrome DevTools Protocol...');
    browser = await chromium.connectOverCDP(CDP_URL);
    console.log('✅ Connected to Chrome\n');
  } catch (e) {
    console.error('❌ Failed to connect:', e.message);
    console.log('\n📝 Make sure Chrome is running with:');
    console.log('   /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\');
    console.log('     --remote-debugging-port=9222 \\');
    console.log('     --user-data-dir=/tmp/chrome-flow-debug \\');
    console.log(`     --load-extension=${EXTENSION_DIR}`);
    process.exit(1);
  }

  try {
    // Get existing pages or create new one
    const pages = browser.contexts()[0]?.pages() || [];
    let page = pages.find(p => p.url().includes('flow')) || pages[0];

    if (!page) {
      console.log('📱 Creating new page...');
      const context = browser.contexts()[0] || await browser.newContext();
      page = await context.newPage();
    }

    console.log(`📍 Current URL: ${page.url()}`);

    // Navigate to Flow if not already there
    if (!page.url().includes('flow')) {
      console.log(`🌐 Navigating to Flow...`);
      await page.goto(FLOW_URL, { waitUntil: 'networkidle', timeout: 30000 });
      console.log('✅ Navigated to Flow\n');
    }

    // Get video settings from storage
    const context = page.context();
    const storage = await context.storageState();
    console.log('📋 Getting video settings...');

    // Read settings from extension storage
    const settingsJson = await page.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.get('videoSettings', (result) => {
          resolve(result.videoSettings || {});
        });
      });
    });

    const settings = settingsJson || {
      productImage: 'https://via.placeholder.com/800x800?text=Product',
      productName: 'Sample Product',
      imageAspectRatio: '9:16',
      imageStyle: 'cinematic',
      imagePromptExtra: 'Product on white background, studio lighting',
      videoMotion: 'auto',
      videoPromptExtra: ''
    };

    console.log('⚙️  Settings:', settings);
    console.log('\n====== STARTING AUTOMATION ======\n');

    // ===== MODE 1: IMAGE SELECTION =====
    console.log('📸 MODE 1: Image Selection\n');

    // Step 1: Click "New project" button
    console.log('1️⃣  Looking for "New project" button...');
    const newProjectBtn = page.locator('button:has-text("New project"), button:has-text("Create")').first();
    
    const isVisible = await newProjectBtn.isVisible().catch(() => false);
    if (isVisible) {
      console.log('✅ Found "New project" button');
      await newProjectBtn.click();
      console.log('✅ Clicked "New project"\n');
    } else {
      console.log('⚠️  "New project" button not visible, checking all buttons...');
      const allButtons = page.locator('button');
      const count = await allButtons.count();
      console.log(`   Found ${count} buttons on page`);
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const text = await allButtons.nth(i).textContent();
        console.log(`   Button ${i}: "${text?.trim()}"`);
      }
    }

    await page.waitForTimeout(2000);

    // Step 2: Upload image
    if (settings.productImage) {
      console.log('2️⃣  Setting product image...');
      
      // Try to find image input field
      const imageInputs = page.locator('input[type="text"]');
      const inputCount = await imageInputs.count();
      console.log(`   Found ${inputCount} text inputs`);

      // Fill the first text input with image URL
      if (inputCount > 0) {
        const firstInput = imageInputs.first();
        console.log('   Filling first text input with image URL...');
        await firstInput.fill(settings.productImage);
        await firstInput.press('Enter');
        console.log(`✅ Set image: ${settings.productImage}\n`);
      }
    }

    await page.waitForTimeout(1500);

    // Step 3: Click Next/Continue button
    console.log('3️⃣  Looking for "Next" or "Continue" button...');
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Next step")').first();
    const nextVisible = await nextBtn.isVisible().catch(() => false);
    
    if (nextVisible) {
      console.log('✅ Found next button');
      await nextBtn.click();
      console.log('✅ Clicked next\n');
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️  Next button not found, continuing...\n');
    }

    // ===== MODE 2: SETTINGS & GENERATION =====
    console.log('⚙️  MODE 2: Settings & Generation\n');

    // Step 4: Set aspect ratio
    console.log(`4️⃣  Setting aspect ratio to ${settings.imageAspectRatio}...`);
    const aspectBtns = page.locator('button:has-text("9:16"), button:has-text("1:1"), button:has-text("16:9")');
    const aspectCount = await aspectBtns.count();
    
    if (aspectCount > 0) {
      for (let i = 0; i < aspectCount; i++) {
        const text = await aspectBtns.nth(i).textContent();
        if (text?.includes(settings.imageAspectRatio)) {
          await aspectBtns.nth(i).click();
          console.log(`✅ Set aspect ratio to ${settings.imageAspectRatio}\n`);
          break;
        }
      }
    } else {
      console.log('⚠️  Aspect ratio buttons not found\n');
    }

    await page.waitForTimeout(800);

    // Step 5: Set image style
    if (settings.imageStyle) {
      console.log(`5️⃣  Setting image style to "${settings.imageStyle}"...`);
      const selects = page.locator('select');
      const selectCount = await selects.count();
      console.log(`   Found ${selectCount} select dropdowns`);

      if (selectCount > 0) {
        const firstSelect = selects.first();
        await firstSelect.selectOption(settings.imageStyle).catch(async () => {
          // Try by label
          const options = firstSelect.locator('option');
          const optCount = await options.count();
          
          for (let i = 0; i < optCount; i++) {
            const optText = await options.nth(i).textContent();
            if (optText?.toLowerCase().includes(settings.imageStyle.toLowerCase())) {
              await firstSelect.selectOption({ value: await options.nth(i).getAttribute('value') });
              break;
            }
          }
        });
        console.log(`✅ Set image style\n`);
      }
    }

    await page.waitForTimeout(500);

    // Step 6: Set image prompt
    if (settings.imagePromptExtra) {
      console.log('6️⃣  Setting image prompt...');
      const textareas = page.locator('textarea');
      const taCount = await textareas.count();
      
      if (taCount > 0) {
        const firstTextarea = textareas.first();
        await firstTextarea.fill(settings.imagePromptExtra);
        console.log(`✅ Set prompt: "${settings.imagePromptExtra}"\n`);
      } else {
        console.log('⚠️  No textarea found for prompt\n');
      }
    }

    await page.waitForTimeout(500);

    // Step 7: Set video motion if needed
    if (settings.videoMotion && settings.videoMotion !== 'auto') {
      console.log(`7️⃣  Setting camera motion to "${settings.videoMotion}"...`);
      const selects = page.locator('select');
      const selectCount = await selects.count();
      
      if (selectCount > 1) {
        const secondSelect = selects.nth(1);
        await secondSelect.selectOption(settings.videoMotion).catch(() => {
          console.log('   (Motion option not found in dropdown)');
        });
        console.log(`✅ Set camera motion\n`);
      }
    }

    await page.waitForTimeout(500);

    // Step 8: Click generate button
    console.log('8️⃣  Looking for generate button...');
    const generateBtn = page.locator(
      'button:has-text("Generate"), button:has-text("Create"), button:has-text("Make"), button:has-text("Start")'
    ).first();

    const generateVisible = await generateBtn.isVisible().catch(() => false);
    if (generateVisible) {
      console.log('✅ Found generate button');
      
      // Take screenshot before generation
      await page.screenshot({ path: 'flow-before-generate.png' });
      console.log('📸 Screenshot saved: flow-before-generate.png');

      await generateBtn.click();
      console.log('🎬 Clicked Generate!\n');

      // Wait a bit and take another screenshot
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'flow-after-generate.png' });
      console.log('📸 Screenshot saved: flow-after-generate.png');
    } else {
      console.log('❌ Generate button not found');
      
      // Print all visible buttons for debugging
      const allBtns = page.locator('button');
      const allCount = await allBtns.count();
      console.log(`\n📌 All buttons on page (${allCount}):`);
      
      for (let i = 0; i < Math.min(allCount, 15); i++) {
        const text = await allBtns.nth(i).textContent();
        const enabled = await allBtns.nth(i).isEnabled();
        console.log(`   ${i}: "${text?.trim()}" ${enabled ? '✅' : '❌'}`);
      }
    }

    console.log('\n✅ Automation complete!');
    console.log('💡 Check the Flow website for generation results');

    // Keep page open for inspection
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed');
  }
}

main();
