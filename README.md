# Toto Translator

A browser extension that provides translation capabilities using machine learning models that run locally in your browser.

## Purpose
The purpose of this extension is to demonstrate the possibility of running machine learning models locally in an efficient way directly in your browser.
By leveraging graphics acceleration, WebAssembly, and web workers, Toto Translator provides translation capabilities without requiring external services or specific server setups like Ollama.

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
1. Clone this repository
```bash
git clone https://github.com/gtoto007/toto-translator.git
cd toto-translator
```
2. Build this extension by run 'yarn install && yarn build:prod'
3. Open Chrome/Edge/Brave and navigate to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the `dist` directory from this project


## Usage

[Instructions on how to use the extension once installed]
# TODO

- [X] ux: show a progress bar when the AI model is in downloading and/or loading
- [X] refactor: instead of add a button for each paragraph, add the button when when user hover the mouse on html element
- [ ] refactor: reset worker logic
- [ ] option ui: change language to translate
- [ ] option ui: change the model language
- [ ] option ui: custom the prompt ********
