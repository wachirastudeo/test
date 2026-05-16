/**
 * explore-flow.js — connect เข้า Chrome ที่เปิดอยู่แล้ว
 *
 * ขั้นตอน:
 * 1. ปิด Chrome ทั้งหมด (Cmd+Q)
 * 2. เปิด Chrome พร้อม remote debugging (รันใน Terminal):
 *
 *    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
 *      --remote-debugging-port=9222 \
 *      --profile-directory=Default
 *
 * 3. ล็อกอิน Google ใน Chrome นั้น แล้วเข้า labs.google/fx/tools/flow
 * 4. รันสคริปต์นี้: node explore-flow.js
 */

const { chromium } = require('playwright');
const fs = require('fs');

const FLOW_URL = 'https://labs.google/fx/tools/flow';
const CDP_URL = 'http://127.0.0.1:9222';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🔌 กำลัง connect เข้า Chrome ที่เปิดอยู่...');
  console.log('   (ต้องเปิด Chrome ด้วย --remote-debugging-port=9222 ก่อน)\n');

  let browser;
  try {
    browser = await chromium.connectOverCDP(CDP_URL);
  } catch (e) {
    console.error('❌ ไม่สามารถเชื่อมต่อได้:', e.message);
    console.log('\n👉 ต้องเปิด Chrome ด้วยคำสั่งนี้ใน Terminal:');
    console.log('   /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --profile-directory=Default\n');
    console.log('   แล้วรอให้ Chrome เปิด → login Google → เข้า Flow → รันสคริปต์นี้ใหม่');
    process.exit(1);
  }

  console.log('✅ เชื่อมต่อสำเร็จ!');

  // ดู tab ที่เปิดอยู่ทั้งหมด
  const contexts = browser.contexts();
  console.log(`\n📂 มี ${contexts.length} context`);

  let page = null;

  // หา tab ที่มี Flow อยู่แล้ว
  for (const ctx of contexts) {
    for (const p of ctx.pages()) {
      const u = p.url();
      console.log('  - Tab:', u.substring(0, 80));
      if (u.includes('labs.google') || u.includes('flow')) {
        page = p;
        console.log('    ☑️ พบ Flow tab!');
      }
    }
  }

  // ถ้าไม่มี Flow tab ให้เปิดใหม่
  if (!page) {
    console.log('\n📍 ยังไม่มี Flow tab — กำลังเปิด...');
    const ctx = contexts[0] || await browser.newContext();
    page = await ctx.newPage();
    await page.goto(FLOW_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } else {
    await page.bringToFront();
  }

  await sleep(3000);

  const url = page.url();
  console.log('\n🔗 URL ปัจจุบัน:', url);

  if (url.includes('accounts.google.com')) {
    console.log('⚠️  ยังไม่ได้ login — กรุณา login ใน Chrome แล้วรันสคริปต์ใหม่');
    process.exit(0);
  }

  // Screenshot
  await page.screenshot({ path: 'flow-step1.png' });
  console.log('📸 Screenshot: flow-step1.png');

  // ======= STEP: Click "New project" =======
  console.log('\n🎯 กำลังหา "New project" button...');
  
  const newProjectBtn = await page.locator('button:has-text("New project"), button:has-text("Create"), [role="button"]:has-text("New project")').first();
  const isVisible = await newProjectBtn.isVisible().catch(() => false);

  if (isVisible) {
    console.log('✅ พบ "New project" button');
    console.log('🖱️ กำลังคลิก...');
    await newProjectBtn.click();
    console.log('✅ คลิกแล้ว! รอให้ page load...');
    
    await page.waitForTimeout(3000);
    console.log('✅ Page loaded\n');
  } else {
    console.log('⚠️ ไม่พบ "New project" button — แกะ DOM ก่อนก่อน');
  }

  // Screenshot หลังคลิก
  await page.screenshot({ path: 'flow-after-click.png' });
  console.log('📸 Screenshot: flow-after-click.png');

  // ดึง interactive elements
  console.log('\n🔍 กำลังแกะ DOM...');

  const elements = await page.evaluate(() => {
    const results = [];

    // ปุ่มทั้งหมด
    document.querySelectorAll('button, a[href], [role="button"]').forEach(el => {
      const text = (el.innerText || el.getAttribute('aria-label') || '').trim();
      if (!text || text.length > 80) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      results.push({
        type: 'button',
        tag: el.tagName,
        text,
        id: el.id,
        class: [...el.classList].join(' ').substring(0, 100),
        role: el.getAttribute('role') || '',
        ariaLabel: el.getAttribute('aria-label') || '',
        visible: rect.top >= 0 && rect.bottom <= window.innerHeight,
      });
    });

    // inputs
    document.querySelectorAll('input, textarea, [contenteditable="true"]').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      results.push({
        type: 'input',
        tag: el.tagName,
        text: '',
        id: el.id,
        class: [...el.classList].join(' ').substring(0, 100),
        placeholder: el.getAttribute('placeholder') || '',
        contenteditable: el.getAttribute('contenteditable') || '',
        visible: rect.top >= 0 && rect.bottom <= window.innerHeight,
      });
    });

    return results;
  });

  console.log(`\n🎯 พบ ${elements.length} elements:\n`);

  // แสดงผล
  const buttons = elements.filter(e => e.type === 'button');
  const inputs = elements.filter(e => e.type === 'input');

  console.log('─── ปุ่ม (Buttons) ───');
  buttons.forEach((el, i) => {
    const vis = el.visible ? '👁️ ' : '   ';
    console.log(`${vis}[${i}] "${el.text}" | tag:${el.tag} id:"${el.id}" class:"${el.class.substring(0,60)}"`);
  });

  console.log('\n─── Input / Textarea ───');
  inputs.forEach((el, i) => {
    const vis = el.visible ? '👁️ ' : '   ';
    console.log(`${vis}[${i}] tag:${el.tag} placeholder:"${el.placeholder}" id:"${el.id}" class:"${el.class.substring(0,60)}"`);
  });

  // ======= AUTO CLICK: Add Media =======
  console.log('\n\n🎯 Auto Click Mode - กำลังหา "Add Media" button...');
  const addMediaBtn = await page.locator('button:has-text("Add Media")').first();
  const addMediaVisible = await addMediaBtn.isVisible().catch(() => false);

  if (addMediaVisible) {
    console.log('✅ พบ "Add Media" button');
    console.log('🖱️ กำลังคลิก...');
    await addMediaBtn.click();
    console.log('✅ คลิกแล้ว! รอให้ dialog เปิด...');
    await page.waitForTimeout(2000);
    
    // Screenshot หลังคลิก Add Media
    await page.screenshot({ path: 'flow-after-add-media.png' });
    console.log('📸 Screenshot: flow-after-add-media.png');

    // ======= Auto Fill: ลองหา input สำหรับ image URL =======
    console.log('\n🔍 หา image URL input...');
    const inputs = page.locator('input[type="text"], input[type="url"], textarea');
    const inputCount = await inputs.count();
    console.log(`   พบ ${inputCount} inputs`);

    if (inputCount > 0) {
      const firstInput = inputs.first();
      const placeholder = await firstInput.getAttribute('placeholder');
      console.log(`   Input แรก placeholder: "${placeholder}"`);
      
      // ใส่ URL ตัวอย่าง
      const sampleUrl = 'https://via.placeholder.com/800x800?text=Product';
      console.log(`\n📝 ใส่ URL: ${sampleUrl}`);
      await firstInput.fill(sampleUrl);
      await firstInput.press('Enter');
      console.log('✅ ใส่ URL สำเร็จ');
      
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'flow-after-fill-url.png' });
      console.log('📸 Screenshot: flow-after-fill-url.png');
    }

    // ======= Auto Click: Next / Confirm =======
    console.log('\n🎯 หา "Next" หรือ "Confirm" button...');
    const nextBtn = await page.locator('button:has-text("Next"), button:has-text("Confirm"), button:has-text("Continue")').first();
    const nextVisible = await nextBtn.isVisible().catch(() => false);

    if (nextVisible) {
      console.log('✅ พบ next button');
      console.log('🖱️ กำลังคลิก...');
      await nextBtn.click();
      console.log('✅ คลิกแล้ว! รอให้ settings screen เปิด...');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'flow-after-next.png' });
      console.log('📸 Screenshot: flow-after-next.png');

      // ======= Auto Fill: Aspect Ratio =======
      console.log('\n🎯 หา aspect ratio buttons...');
      const aspectBtn916 = await page.locator('button:has-text("9:16")').first();
      const aspectVisible = await aspectBtn916.isVisible().catch(() => false);

      if (aspectVisible) {
        console.log('✅ พบ 9:16 button');
        console.log('🖱️ กำลังคลิก...');
        await aspectBtn916.click();
        console.log('✅ คลิกแล้ว');
        await page.waitForTimeout(1000);
      }

      // ======= Auto Fill: Style Dropdown =======
      console.log('\n🎯 หา style dropdown...');
      const selects = page.locator('select');
      const selectCount = await selects.count();
      console.log(`   พบ ${selectCount} dropdowns`);

      if (selectCount > 0) {
        console.log('📝 ลองเลือก "cinematic"...');
        await selects.first().selectOption('cinematic').catch(() => {
          console.log('   (ไม่สำเร็จ)');
        });
        console.log('✅ เลือกแล้ว');
        await page.waitForTimeout(800);
      }

      // ======= Auto Fill: Prompt =======
      console.log('\n🎯 หา prompt textarea...');
      const textareas = page.locator('textarea');
      const taCount = await textareas.count();
      console.log(`   พบ ${taCount} textareas`);

      if (taCount > 0) {
        const samplePrompt = 'สินค้าบนพื้นขาว, แสงสตูดิโอ, มืออบอุ่น';
        console.log(`📝 ใส่ prompt: "${samplePrompt}"`);
        await textareas.first().fill(samplePrompt);
        console.log('✅ ใส่ prompt สำเร็จ');
        await page.waitForTimeout(800);
      }

      // ======= Auto Click: Generate =======
      console.log('\n🎯 หา Generate button...');
      const generateBtn = await page.locator('button:has-text("Generate"), button:has-text("Create"), button:has-text("Start")').first();
      const genVisible = await generateBtn.isVisible().catch(() => false);

      if (genVisible) {
        console.log('✅ พบ Generate button');
        console.log('🖱️ กำลังคลิก...');
        await page.screenshot({ path: 'flow-before-generate.png' });
        await generateBtn.click();
        console.log('✅ คลิก Generate แล้ว! 🚀');
        
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'flow-generating.png' });
        console.log('📸 Screenshot: flow-generating.png');
      } else {
        console.log('❌ ไม่พบ Generate button');
      }
    } else {
      console.log('⚠️ ไม่พบ next button');
    }
  } else {
    console.log('⚠️ ไม่พบ "Add Media" button');
  }

  // บันทึก DOM
  const html = await page.content();
  fs.writeFileSync('flow-dom.html', html);
  console.log('\n💾 บันทึก DOM: flow-dom.html');

  // บันทึก JSON
  fs.writeFileSync('flow-elements.json', JSON.stringify(elements, null, 2));
  console.log('💾 บันทึก elements: flow-elements.json');

  await page.screenshot({ path: 'flow-step2-analyzed.png', fullPage: true });
  console.log('📸 Screenshot: flow-step2-analyzed.png');

  console.log('\n✅ วิเคราะห์เสร็จแล้ว! กด Ctrl+C เพื่อออก');
  await sleep(999999);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
