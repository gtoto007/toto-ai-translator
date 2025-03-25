"use strict";

import { ProgressBarUI } from './ProgressBarUI';

import WebLLM from './WebLLM';

// Create a progress bar element
const progressBar = new ProgressBarUI();


// Initialize the engine
let llm: WebLLM;
let isInitializing = false;

async function init() {
    if (isInitializing) {
        console.log('Engine initialization already in progress');
        return;
    }

    isInitializing = true;
    try {
        llm = await WebLLM.createAsync(progressBar.showProgress.bind(progressBar), 'Llama-3.1-8B-Instruct-q4f16_1-MLC');
        progressBar.hide();

        // Run the initial setup when the page is loaded
        document.addEventListener('DOMContentLoaded', () => {
            // Add buttons to existing paragraphss
            addButtonsToParagraphs();

            // Set up observer for future changes
            setupMutationObserver();
        });

        addButtonsToParagraphs();

        // Set up observer for future changes
        setupMutationObserver();

        console.log('WebLLM engine initialized successfully');
    } catch (error) {
        console.error('Error initializing engine:', error);
    } finally {
        isInitializing = false;
    }
}



function addButtonsToParagraphs() {
    // Get all paragraphs on the page
    const paragraphs = document.querySelectorAll('p');

    // Loop through each paragraph
    paragraphs.forEach((paragraph, index) => {
        addButtonToParagraph(paragraph, index);
    });
}

function addButtonToParagraph(paragraph: HTMLParagraphElement, index: number) {
    if (paragraph.classList.contains('toto-translator-processed')) {
        return; // Paragraph already processed, skip
    }


    // Create a button element
    const button = document.createElement('button');
    button.textContent = 'Translate';
    button.dataset.paragraphIndex = index.toString();
    button.className = 'button-toto-translator'; // Use the new class instead of inline styles


    // Add click event listener to the button
    button.addEventListener('click', async function () {
        // Get the text of the paragraph
        const paragraphText = paragraph.textContent;


        // Use the engine to translate the text
        try {
            if (!llm) {
                console.log('Engine not initialized yet, please wait...');
                return;
            }

            // Implement translation logic here
            console.log('Translating text using the engine...');
            const pTranslation = document.createElement('div');
            pTranslation.className = 'toto-translator-container';

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

            // Log the text to the console
            console.log(`Paragraph ${index + 1} text:`, paragraphText);

            pTranslation.appendChild(loadingSpinner);
            paragraph.parentNode.insertBefore(pTranslation, paragraph.nextSibling);

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

        } catch (error) {
            console.error('Error during translation:', error);
        }
    });

    // Insert the button after the paragraph
    paragraph.appendChild(button);
    // Add hover event listeners to the paragraph
    paragraph.addEventListener('mouseenter', () => {
        button.style.display = 'inline-block'; // Show the button
    });

    paragraph.classList.add('toto-translator-processed');


    paragraph.addEventListener('mouseleave', () => {
        button.style.display = 'none'; // Hide the button again
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
                    } else if (item.nodeType === 1) { // Element node
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


// Handle reconnection when page comes back from bfcache (back/forward cache)
function setupReconnectionHandlers() {
    // Listen for pageshow events with persisted=true (page restored from bfcache)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            console.log('Page was restored from back/forward cache, reconnecting WebLLM...');
            init();
        }
    });

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !llm) {
            console.log('Page became visible and WebLLM is not initialized, reconnecting...');
            init();
        }
    });

    // Listen for custom connection lost events from WebLLM
    window.addEventListener('webllm-connection-lost', () => {
        console.log('WebLLM connection lost event received, attempting to reconnect...');
        // Set llm to null to force a complete reinitialization
        llm = null;

        // Send a message to the background script to notify about the connection loss
        chrome.runtime.sendMessage({ type: 'webllm-connection-lost', timestamp: Date.now() }, (response) => {
            init();
        });
    });
}

// Initialize the engine
init();

// Set up reconnection handlers
setupReconnectionHandlers();

