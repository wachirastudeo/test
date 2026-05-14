import { fetchShowcaseProducts } from './tiktok-api.js';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openFlow') {
    chrome.tabs.create({ url: 'https://labs.google/fx/tools/flow' });
    sendResponse({ status: 'opened' });
  }

  if (message.action === 'openPanel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs?.[0]?.id;
      if (!tabId) return sendResponse({ status: 'no_tab' });
      chrome.tabs.sendMessage(tabId, { action: 'openPanel' }, (resp) => {
        sendResponse(resp || { status: 'panel_requested' });
      });
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
