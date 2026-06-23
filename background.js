// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openTemplatePage') {
        chrome.tabs.create({ url: 'template.html' });
    }
});