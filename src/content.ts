// Content script for Toto Translator
console.log('Content script loaded');

import {
  CreateExtensionServiceWorkerMLCEngine,
  MLCEngineInterface,
  InitProgressReport
} from "@mlc-ai/web-llm";

const initProgressCallback = (report: InitProgressReport) => {
  console.log(report.progress);
};

// Function to add button to a single paragraph
function addButtonToParagraph(paragraph, index) {
  // Check if button already exists for this paragraph
  const nextSibling = paragraph.nextSibling;
  if (nextSibling && nextSibling.nodeName === 'BUTTON' && 
      nextSibling.dataset.paragraphIndex !== undefined) {
    return; // Button already exists, skip
  }
  
  // Create a button element
  const button = document.createElement('button');
  button.textContent = 'Translate';
  button.style.marginLeft = '10px';
  button.style.fontSize = '12px';
  button.style.padding = '2px 5px';
  button.style.cursor = 'pointer';
  button.dataset.paragraphIndex = index;
  
  // Add click event listener to the button
  button.addEventListener('click', function() {
    // Get the text of the paragraph
    const paragraphText = paragraph.textContent;
    
    // Log the text to the console
    console.log(`Paragraph ${index + 1} text:`, paragraphText);
    
    // Send message to background script (optional)
    chrome.runtime.sendMessage({
      action: 'logParagraph',
      paragraphIndex: index,
      paragraphText: paragraphText
    }, function(response) {
      // Handle response from background script (optional)
      console.log('Background script response:', response);
    });
  });
  
  // Insert the button after the paragraph
  paragraph.parentNode.insertBefore(button, paragraph.nextSibling);
}

// Function to add buttons to all paragraphs
function addButtonsToParagraphs() {
  // Get all paragraphs on the page
  const paragraphs = document.querySelectorAll('p');
  
  // Loop through each paragraph
  paragraphs.forEach((paragraph, index) => {
    addButtonToParagraph(paragraph, index);
  });
}

// Set up a MutationObserver to watch for DOM changes
function setupMutationObserver() {
  // Create a new observer
  const observer = new MutationObserver((mutations) => {
    let shouldAddButtons = false;
    
    // Check if any mutations added new paragraphs
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const item of mutation.addedNodes) {
          if (item.nodeName === 'P') {
            shouldAddButtons = true;
            break;
          } else if(item.nodeType === 1) { // Element node
            if ((item as Element).querySelectorAll('p').length > 0) {
              shouldAddButtons = true;
              break;
            }
          }
        }
      }
    });
    
    // If new paragraphs were added, add buttons to all paragraphs
    if (shouldAddButtons) {
      addButtonsToParagraphs();
    }
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, {
    childList: true,      // Watch for changes in direct children
    subtree: true,        // Watch for changes in the entire subtree
    attributes: false,    // Don't watch for changes in attributes
    characterData: false  // Don't watch for changes in text content
  });
  
  return observer;
}

// Run the initial setup when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add buttons to existing paragraphs
  addButtonsToParagraphs();
  
  // Set up observer for future changes
  setupMutationObserver();
});

// Also run it immediately in case the DOM is already loaded
addButtonsToParagraphs();
setupMutationObserver();