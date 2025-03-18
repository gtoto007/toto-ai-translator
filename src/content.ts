"use strict";

// Content script for Toto Translator
console.log('Content script loaded');

import {
  InitProgressReport,
} from "@mlc-ai/web-llm";

import WebLLM from './WebLLM';



const initProgressCallback = (report: InitProgressReport) => {
  console.log(report.progress);
};

// Initialize the engine
let  llm: WebLLM;

// Immediately invoke async function to initialize the engine
(async () => {
  try {
    llm = await WebLLM.createAsync(initProgressCallback);

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
  button.addEventListener('click', async function() {
    // Get the text of the paragraph
    const paragraphText = paragraph.textContent;
    
    // Log the text to the console
    console.log(`Paragraph ${index + 1} text:`, paragraphText);
    
    // Use the engine to translate the text
    try {
      if (!llm) {
        console.log('Engine not initialized yet, please wait...');
        return;
      }
      
      // Implement translation logic here
      console.log('Translating text using the engine...');
      const pTranslation = document.createElement('div');
      
      // Create and show loading indicator
      const loadingSpinner = document.createElement('span');
      loadingSpinner.textContent = 'Translating ';
      loadingSpinner.className = 'toto-loading-spinner';
      loadingSpinner.style.display = 'inline-block';
      loadingSpinner.style.marginLeft = '5px';
      loadingSpinner.style.fontStyle = 'italic';
      loadingSpinner.style.color = '#666';
      
      // Add a simple animation
      const dots = document.createElement('span');
      dots.className = 'toto-loading-dots';
      dots.textContent = '';
      loadingSpinner.appendChild(dots);
      
      // Animate the dots
      let dotsCount = 0;
      const dotsInterval = setInterval(() => {
        dots.textContent = '.'.repeat(dotsCount % 4);
        dotsCount++;
      }, 300);
      
      pTranslation.appendChild(loadingSpinner);
      button.parentNode.insertBefore(pTranslation, button.nextSibling);

      const translationPrompt = 
        `You are the best Italian interpreter and transcription corrector. ` +
        `Your task is to first correct any transcription errors, missing punctuation, ` +
        `or unclear phrases in the given text to make it a complete and natural English sentence. ` +
        `This text may contain words or phrases that were misheard or incorrectly transcribed. ` +
        `Use context and common sense to reconstruct the intended meaning. ` +
        `Once the text is correctly reconstructed, translate it into idiomatic and natural Italian. ` +
        `The context is related to Software Development. ` +
        `Avoid to translate tecnhical terms such as test, codeception, keys, etc. ` +
        `Provide only the final translated sentence and nothing else. ` +
        `Do not add any explanations, thoughts, or comments—just correct and translate. ` +
        `The sentence is: ${paragraphText}`;

      await llm.sendMessage(translationPrompt, (translation) => {
        // Clear the loading spinner and set the translation text
        pTranslation.textContent = translation; 
      });
      
      // Clear the interval when translation is complete
      clearInterval(dotsInterval);
       
      // Send message to background script (optional)
      chrome.runtime.sendMessage({
        action: 'logParagraph',
        paragraphIndex: index,
        paragraphText: paragraphText
      }, function(response) {
        // Handle response from background script (optional)
        console.log('Background script response:', response);
      });
    } catch (error) {
      console.error('Error during translation:', error);
    }
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


addButtonsToParagraphs();
  
// Set up observer for future changes
setupMutationObserver();
} catch (error) {
  console.error('Error initializing engine:', error);
}
})();


