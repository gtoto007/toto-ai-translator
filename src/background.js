import { ExtensionServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// Hookup an engine to a service worker handler
let handler;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);
  sendResponse({ status: 'received' });
});


chrome.runtime.onConnect.addListener(function (port) {
  console.log("Connected to port:", port);
  console.assert(port.name == "web_llm_service_worker");
  if (handler === undefined) {
    handler = new ExtensionServiceWorkerMLCEngineHandler(port);
  } else {
    handler.setPort(port);
  }
  port.onMessage.addListener(handler.onmessage.bind(handler));
});
