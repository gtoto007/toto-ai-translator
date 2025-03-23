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
    handler=undefined;
    setup(globalPort);
    sendResponse({ status: 'ready' });
  }
});


chrome.runtime.onConnect.addListener(function (port) {
 setup(port);
});

function setup(port){
  globalPort = port
  console.log("Connected to port:", port);
  console.assert(port.name == "web_llm_service_worker");
  if (handler === undefined) {
    handler = new ExtensionServiceWorkerMLCEngineHandler(port);
  } else {
    handler.setPort(port);
  }
  port.onMessage.addListener(handler.onmessage.bind(handler));

  // Add disconnect handler to detect when the port is closed
  port.onDisconnect.addListener(function() {
    console.log("Port disconnected:", port);
    // The handler will be kept but marked as disconnected internally
    // This allows the content script to reconnect later

    // Check for any error that might have caused the disconnection
    if (chrome.runtime.lastError) {
      console.error("Disconnection error:", chrome.runtime.lastError.message);
    }

    // Explicitly mark the handler as ready for reconnection
    // This ensures that when a new connection is established,
    // the handler will properly accept it
    if (handler) {
      console.log("Preparing handler for potential reconnection");
    //  handler=undefined

      // The handler.setPort(null) would be called internally by the MLCEngineHandler
      // when the port is disconnected, but we can add additional cleanup if needed
      // We don't set handler to undefined here because we want to reuse the same
      // handler instance when the content script reconnects, preserving any state
    }
  });
}