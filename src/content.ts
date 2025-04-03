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
        console.log('Error initializing engine:', error);
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

    // Create a button element
    const button = document.createElement('button');
    button.textContent = 'AI T';
    button.dataset.paragraphIndex = index.toString();
    button.className = 'button-toto-translator';
    button.style.display = 'inline-block'; // Always show the button when added

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
               `You are an expert Italian interpreter and transcription corrector. ` +
                `Your task is to correct any transcription errors, missing punctuation, ` +
                `or unclear phrases in the provided text, transforming it into a complete and natural English sentence. ` +
                `The text may contain misheard or incorrectly transcribed words or phrases. ` +
                `Use context and common sense to infer the intended meaning. ` +
                `Once the text is properly reconstructed, translate it into idiomatic and natural Italian. ` +
                `The context could be related to Software Development. ` +
                `Do not translate technical terms such as test, Codeception, keys, etc. ` +
                `Output only the final translated sentence—no explanations, thoughts, or comments. ` +
                `The paragraph to translate is marked between ### symbols. Do not include the ### symbols in your output. ` +
                `### ${paragraphText} ###`;
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

// Track the currently active element when key is pressed

// Define the activation key (Alt key by default)
const ACTIVATION_KEY = 'Alt';



// Add keydown event listener to activate translator
document.addEventListener("keydown", (e) => {
    if (e.key === ACTIVATION_KEY) {

        // Get the element under the mouse cursor using stored coordinates
        const elemUnderCursor = document.elementFromPoint(mouseX, mouseY);

        // Check if it's a valid text element
        const validTextElements = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'SPAN', 'ARTICLE', 'SECTION', 'LI', 'FIGCAPTION', 'FONT','I','A'];

        if (elemUnderCursor && elemUnderCursor instanceof HTMLElement &&
            validTextElements.includes(elemUnderCursor.tagName.toUpperCase()) &&
            hasDirectText(elemUnderCursor)) {


            if (elemUnderCursor.querySelector('.button-toto-translator') || elemUnderCursor.classList.contains('.toto-translator-container')) {
                return;
            }
            addTranslatorButton(elemUnderCursor, 0);
        }
    }
});


let mouseX = 0;
let mouseY = 0;
document.addEventListener("mousemove", (e) => {
    // Update global mouse position
    mouseX = e.clientX;
    mouseY = e.clientY;

})

function hasDirectText(elem:HTMLElement) {
    return Array.from(elem.childNodes).some(
        node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
    );
}

