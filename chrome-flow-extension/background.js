import { fetchShowcaseProducts } from './tiktok-api.js';

// Open side panel when extension icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openFlow') {
    chrome.tabs.create({ url: 'https://labs.google/fx/tools/flow' });
    sendResponse({ status: 'opened' });
  }

  if (message.action === 'openFlowAndGenerate') {
    chrome.tabs.create({ url: 'https://labs.google/fx/tools/flow' }, (tab) => {
      // Flow is a SPA — wait for it to fully render before injecting
      const MAX_WAIT = 30000;
      const CHECK_INTERVAL = 1000;
      let elapsed = 0;
      let injected = false;
      
      const checkAndInject = setInterval(() => {
        chrome.tabs.get(tab.id, (tabInfo) => {
          if (!tabInfo || injected) {
            clearInterval(checkAndInject);
            return;
          }
          
          elapsed += CHECK_INTERVAL;
          
          if (tabInfo.status === 'complete') {
            // Check if Flow's buttons are actually rendered
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                func: () => document.querySelectorAll('button').length
              },
              (results) => {
                const btnCount = results?.[0]?.result || 0;
                if (btnCount > 0 && !injected) {
                  injected = true;
                  clearInterval(checkAndInject);
                  console.log(`✅ Flow DOM ready (${btnCount} buttons), injecting...`);
                  chrome.scripting.executeScript(
                    { target: { tabId: tab.id }, files: ['flow-script.js'] },
                    () => console.log('✅ Flow script injected')
                  );
                } else if (elapsed >= MAX_WAIT && !injected) {
                  injected = true;
                  clearInterval(checkAndInject);
                  console.log('⚠️ Timeout, injecting anyway...');
                  chrome.scripting.executeScript(
                    { target: { tabId: tab.id }, files: ['flow-script.js'] },
                    () => console.log('✅ Flow script injected (timeout)')
                  );
                }
              }
            );
          }
        });
      }, CHECK_INTERVAL);
      
      sendResponse({ status: 'opened', tabId: tab.id });
    });
    return true;
  }

  if (message.action === 'openPanel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.windowId) {
        chrome.sidePanel.open({ windowId: tabs[0].windowId })
          .then(() => sendResponse({ status: 'panel_opened' }))
          .catch((error) => sendResponse({ status: 'error', error: error.message }));
      }
    });
    return true;
  }

  if (message.action === 'injectFlowScript') {
    const tabId = sender.tab?.id;
    if (!tabId) return sendResponse({ status: 'no_tab' });

    chrome.scripting.executeScript(
      {
        target: { tabId },
        files: ['flow-script.js']
      },
      () => sendResponse({ status: 'injected' })
    );
    return true;
  }

  if (message.type === 'FETCH_PRODUCTS') {
    fetchShowcaseProducts({ pageToken: message.payload?.pageToken, pageSize: message.payload?.pageSize })
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});
