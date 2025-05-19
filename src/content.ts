"use strict";

import {ProgressBarUI} from './ProgressBarUI';

import WebLLM from './WebLLM';
import {getConfig} from './config';


const validTextElements = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'ARTICLE', 'SECTION', 'LI', 'FIGCAPTION', 'FONT', 'I', 'A'];
// Initialize the engine
let llm: WebLLM | undefined;
let isInitializing = false;

let requestToResetWorker = false;

let InitRetryCounter = 0;


async function init(translateContainer?: HTMLElement) {
    if (isInitializing) {
        throw new Error('Engine initialization already in progress');
    }
    isInitializing = true;


    //a workaround to be ensure the worker is enabled.
    let port = chrome.runtime.connect({name: "popup-connection"});
    let config = await getConfig();
    if (!config.enablePageTranslation) {
        return false
    }
    // Create a progress bar element
    const progressBar = new ProgressBarUI(translateContainer);
    console.log("WebLLM engine initializing with model ", config.modelName, " please wait...")
    llm = await WebLLM.createAsync(progressBar.showProgress.bind(progressBar), config.modelName);
    addExtensionDisabledListener();
    progressBar.hide();

    isInitializing = false;
    return true;
}


document.addEventListener("click", async (e) => {
    // Check if Alt key is pressed during click
    if (e.altKey) {
        // Get the element that was clicked directly from the event
        const elemUnderCursor = e.target;

        if (!(elemUnderCursor instanceof HTMLElement) || !hasDirectText(elemUnderCursor)) {
            return;
        }

        const elem = retrieveElementToTranslate(elemUnderCursor);

        if (!elem) {
            return;
        }

        translateContent(elem);

        // Prevent default click behavior
        e.preventDefault();
    }
});

function hasDirectText(elem: HTMLElement) {
    return Array.from(elem.childNodes).some(
        node => node.textContent != null && node.textContent.trim().length > 0
    );
}

function buildTranslatorBox() {
    const translatorContainer = document.createElement('div');
    translatorContainer.className = 'toto-translator-container';
    // Create loading text with spinner
    const loadingDiv = document.createElement('div');
    loadingDiv.style.display = 'flex';
    loadingDiv.style.alignItems = 'center';
    loadingDiv.style.marginBottom = '12px';


    const spinner = document.createElement('div');
    spinner.style.width = '14px';
    spinner.style.height = '14px';
    spinner.style.border = '2px solid #ccc';
    spinner.style.borderTop = '2px solid #4CAF50';
    spinner.style.borderRadius = '50%';
    spinner.style.marginRight = '8px';
    spinner.style.animation = 'spin 1s linear infinite';

    const style = document.createElement('style');
    style.innerHTML = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;
    document.head.appendChild(style);


    const loadingText = document.createElement('span');
    loadingText.id = "toto-loading-text";
    loadingText.textContent = 'Translating...';

    loadingDiv.appendChild(spinner);
    loadingDiv.appendChild(loadingText);
    translatorContainer.appendChild(loadingDiv);
    return translatorContainer;
}

async function translateContent(element: HTMLElement) {
    if (!element.textContent || !element.parentNode)
        return;

    // @ts-ignore
    const paragraphText = element.textContent
    const translatorBox = buildTranslatorBox();

    element.parentNode.insertBefore(translatorBox, element.nextSibling);

    if (requestToResetWorker) {
        llm = undefined;
        await resetWorker()
        requestToResetWorker = false
    }

    // Use the engine to translate the text
    try {
        if (!llm) {
            if (!await init(translatorBox) || !llm) {
                throw new Error('Engine not initialized yet, please wait and try again.');
            }
        }

        let config = await getConfig();

        if (llm.modelName != config.modelName) {
            throw new Error('Model changed, please wait that the model is loaded and try again.');
        }


        const translationPrompt =
            `**Role:** Expert ${config.targetLanguage} Translator & Corrector for ${config.sourceLanguage} text.
                **Input:** A potentially flawed ${config.sourceLanguage} text segment. It might have transcription errors, missing punctuation, or unclear parts.
                **Output Rule**: Reply only with the  ${config.targetLanguage} translation. Do not include introductions, explanations, or any ${config.sourceLanguage}. Do not write anything else.

                **Task:**
                1.  **Interpret & Correct:** Understand the provided ${config.sourceLanguage} text (${paragraphText}). Mentally correct errors (typos, misheard words, grammar, punctuation) to determine the most likely intended complete sentence(s). Use the software development context.
                2.  **Translate:** Translate the *corrected and understood* ${config.sourceLanguage} meaning into fluent, natural-sounding ${config.targetLanguage}. Ensure the *entire* intended message is fully translated.
                3. **Preserve Terms:** Do not translate specific technical terms
                
                **Output Instructions:**
                *   Provide *only* the final ${config.targetLanguage} translation.
                *   The output must be the complete translation, covering the full meaning of the interpreted source text.
                *   Do not include the original text, the corrected source text, or any explanations.
                
                
                **Text to Process:**
                ${paragraphText}`

        await llm.sendMessage(translationPrompt, (translation) => {
            // Clear the loading spinner and set the translation text
            translatorBox.textContent = translation;
        });


    } catch (error) {
        console.error('Error during translation:', error);
        translatorBox.textContent = error instanceof Error ? error.message : String(error);
        requestToResetWorker = true;
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

// Handle reconnection when page comes back from bfcache (back/forward cache)
function setupReconnectionHandlers() {
    // Listen for pageshow events with persisted=true (page restored from bfcache)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted && llm) {
            llm = undefined
        }
    });

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && llm) {
            llm = undefined
        }
    });

}


// Set up reconnection handlers
setupReconnectionHandlers();

function addExtensionDisabledListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'extensionDisabled') {
            // Clean up resources when the extension is disabled
            if (llm) {
                llm.unload().then(() => {
                    llm = undefined;
                    console.log('WebLLM engine unloaded due to extension being disabled');
                }).catch(err => {
                    console.error('Error unloading WebLLM:', err);
                });
            }
        }

        // Return true if you want to use sendResponse asynchronously
        return true;
    });

}

function retrieveElementToTranslate(elem: HTMLElement) {

    if (elem.querySelector('.button-toto-translator') || elem.classList.contains('.toto-translator-container')) {
        return;
    }

    if (validTextElements.includes(elem.tagName.toUpperCase())) {
        return elem;
    }

    if (!elem.parentElement)
        return;

    return retrieveElementToTranslate(elem.parentElement)
}


async function resetWorker(): Promise<unknown> {
    console.log('resetting worker');
    try {
        // Wrap the chrome.runtime.sendMessage in a Promise
        return await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                {type: 'webllm-connection-lost', timestamp: Date.now()},
                (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                }
            );
        });

    } catch (e) {
        console.error('Exception while sending message:', e);
        throw e; // Re-throw the error so it can be caught by the caller
    }
}

