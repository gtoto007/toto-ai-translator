import { ExtensionServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// Hookup an engine to a service worker handler
let handler;
let globalPort;
// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);
  // Handle specific message types
  if (message.type === 'webllm-connection-lost') {
    console.log('WebLLM connection lost event received in background script at:', new Date(message.timestamp).toISOString());
    setup(globalPort,true);
    sendResponse({ status: 'ready' });
  }
});


chrome.runtime.onConnect.addListener(function (port) {
 setup(port);
});

function setup(port,resetWorker=false) {
  globalPort = port
  console.log("Connected to port:", port);
  if (handler === undefined || resetWorker) {
    handler = new ExtensionServiceWorkerMLCEngineHandler(port);
  } else {
    handler.setPort(port);
  }
  port.onMessage.addListener(handler.onmessage.bind(handler));
}
