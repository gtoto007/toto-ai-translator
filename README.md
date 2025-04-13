# Toto Translator

A browser extension that provides translation capabilities using machine learning models that run locally in your browser.

## Purpose
The purpose of this extension is to demonstrate the possibility of running machine learning models locally in an efficient way directly in your browser.
By leveraging graphics acceleration, WebAssembly, and web workers, Toto Translator provides translation capabilities without requiring external services or specific server setups like Ollama.

![demo.gif](demo.gif)

## Features

- Translate text directly in your browser
- Offline translation using WebLLM technology
- Lightweight and privacy-focused (no cloud services needed for translation)

## Technologies

- WebLLM (@mlc-ai/web-llm) for browser-based machine learning
- TypeScript
- Chrome Extension API
- Parcel for bundling

## Development Setup

### Prerequisites

- Node.js
- Yarn package manager

## Loading the Extension
1. Clone this repository:
   ```bash
   git clone https://github.com/gtoto007/toto-translator.git
   cd toto-translator
   ```
2. Build the extension by running:
   ```bash
   yarn install && yarn build:prod
   ```
3. Open Chrome, Edge, or Brave and go to:  
   `chrome://extensions/`
4. Enable **Developer mode** (toggle switch in the top right).
5. Click **Load unpacked** and select the `dist` directory inside the project folder.


## How to Use
1.	After installing the extension, navigate to any webpage that contains text.
2.	Wait for the LLM download process to complete — this only happens the first time.
3.	Click on the text you want to translate while holding down the *Alt key* to activate the translator.
4.	The translated text will appear below the original content.


Note: The extension uses a local machine learning model that runs directly in your browser, so the first translation might take some time to load the model.

- [X] ux: show a progress bar when the AI model is in downloading and/or loading
- [X] refactor: instead of add a button for each paragraph, add the button when when user hover the mouse on html element
- [X] change activation behaviour: when user key down a specific key, the extension will be activated
- [X] refactor: reset worker logic
- [X] option ui: change source and target language to translate
- [X] option ui: change the model language
- [ ] option ui: custom the prompt ********
