"use strict";

import {ProgressBarUI} from './ProgressBarUI';

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
        console.log("WebLLM engine initializing, please wait...")
        llm = await WebLLM.createAsync(progressBar.showProgress.bind(progressBar), 'Llama-3.1-8B-Instruct-q4f16_1-MLC');
        progressBar.hide();
        console.log('WebLLM engine initialized successfully');
    } catch (error) {
        console.error('Error initializing engine:', error);
    } finally {
        isInitializing = false;
    }
}


function waitingMessage() {
    const message = document.createElement('span');
    message.textContent = 'Translating ';
    message.style.display = 'inline-block';
    message.style.marginLeft = '5px';
    message.style.fontStyle = 'italic';
    message.style.color = '#666';

    // Add a simple animation
    const dots = document.createElement('span');
    dots.textContent = '';
    message.appendChild(dots);

    // Animate the dots
    let dotsCount = 0;
    const dotsInterval = setInterval(() => {
        dots.textContent = '.'.repeat(dotsCount % 4);
        dotsCount++;
    }, 300);
    return {message: message, dotsInterval};
}

function addTranslatorButton(element: HTMLElement, index: number) {
    if (element.querySelector('.button-toto-translator') || element.classList.contains('.toto-translator-container')) {
        return;
    }

    // Create a button element
    const button = document.createElement('button');
    button.textContent = 'AI T';
    button.dataset.paragraphIndex = index.toString();
    button.className = 'button-toto-translator'; // Use the new class instead of inline styles


    // Add click event listener to the button
    button.addEventListener('click', async function () {
        // Get the text of the paragraph
        const paragraphText = element.textContent;


        // Use the engine to translate the text
        try {
            if (!llm) {
                console.log('Engine not initialized yet, please wait...');
                return;
            }

            console.log('Translating text using the engine...');
            const translatorContainer = document.createElement('div');
            translatorContainer.className = 'toto-translator-container';

            const {message, dotsInterval} = waitingMessage();

            console.log(`Paragraph ${index + 1} text:`, paragraphText);
            translatorContainer.appendChild(message);
            element.parentNode.insertBefore(translatorContainer, element.nextSibling);

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
                translatorContainer.textContent = translation;
            });

            // Clear the interval when translation is complete
            clearInterval(dotsInterval);

        } catch (error) {
            console.error('Error during translation:', error);
        }
    });

    // Insert the button after the paragraph
    element.appendChild(button);
    // Add hover event listeners to the paragraph
    element.addEventListener('mouseenter', () => {
        button.style.display = 'inline-block'; // Show the button
    });

    element.addEventListener('mouseleave', () => {
        button.remove()
    });

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
        chrome.runtime.sendMessage({type: 'webllm-connection-lost', timestamp: Date.now()}, (response) => {
            init();
        });
    });
}

// Initialize the engine
init();

// Set up reconnection handlers
setupReconnectionHandlers();

document.addEventListener("mouseover", (e) => {
    //check if e.target is text element
    const validTextElements = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'SPAN', 'ARTICLE', 'SECTION', 'LI','FIGCAPTION'];

    if (e.target && e.target instanceof HTMLElement) {
        console.log(e.target, e.target.innerText, e.target.children.length);
    }
    if (e.target && e.target instanceof HTMLElement && validTextElements.includes(e.target.tagName.toUpperCase()) && e.target.innerText.trim().length > 0) {
        addTranslatorButton(e.target as HTMLElement, 0);
    }
})

