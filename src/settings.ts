// settings.ts
import {getConfig, updateConfig, Config} from './config';
import {ModelRecord, prebuiltAppConfig} from "@mlc-ai/web-llm";


const languages = [
    {value: "English", label: "English"},
    {value: "Chinese", label: "Chinese"},
    {value: "Spanish", label: "Spanish"},
    {value: "Arabic", label: "Arabic"},
    {value: "Hindi", label: "Hindi"},
    {value: "Bengali", label: "Bengali"},
    {value: "Portuguese", label: "Portuguese"},
    {value: "Russian", label: "Russian"},
    {value: "Japanese", label: "Japanese"},
    {value: "German", label: "German"},
    {value: "French", label: "French"},
    {value: "Italian", label: "Italian"},
    {value: "Dutch", label: "Dutch"},
    {value: "Korean", label: "Korean"},
    {value: "Turkish", label: "Turkish"},
    {value: "Vietnamese", label: "Vietnamese"},
    {value: "Polish", label: "Polish"},
    {value: "Ukrainian", label: "Ukrainian"},
    {value: "Persian", label: "Persian"},
    {value: "Indonesian", label: "Indonesian"},
    {value: "Malay", label: "Malay"},
    {value: "Thai", label: "Thai"},
    {value: "Swedish", label: "Swedish"},
    {value: "Norwegian", label: "Norwegian"},
    {value: "Danish", label: "Danish"},
    {value: "Finnish", label: "Finnish"},
    {value: "Greek", label: "Greek"},
    {value: "Czech", label: "Czech"},
    {value: "Romanian", label: "Romanian"},
    {value: "Hungarian", label: "Hungarian"},
    {value: "Hebrew", label: "Hebrew"},
    {value: "Bulgarian", label: "Bulgarian"},
    {value: "Slovak", label: "Slovak"},
    {value: "Croatian", label: "Croatian"},
    {value: "Serbian", label: "Serbian"},
    {value: "Urdu", label: "Urdu"},
    {value: "Swahili", label: "Swahili"},
    {value: "Tamil", label: "Tamil"},
    {value: "Telugu", label: "Telugu"},
    {value: "Marathi", label: "Marathi"},
    {value: "Kannada", label: "Kannada"}
];


function createModelOption(model: ModelRecord) {
    // Format RAM size
    let ramSize: string;
    if(!model.vram_required_MB){
        ramSize = "Unknown";
    }else if (model.vram_required_MB >= 1024) {
        ramSize = `${(model.vram_required_MB / 1024).toFixed(1)}GB`;
    } else {
        ramSize = `${model.vram_required_MB.toLocaleString()}MB`;
    }
    return {
        value: model.model_id,
        label: `<div class="model-option">
                  <span class="model-name">${model.model_id}</span>
                  <span class="model-ram">${ramSize} RAM</span>
                </div>`
    };
}


document.addEventListener('DOMContentLoaded', async () => {
    const config = await getConfig();

    // Initialize language dropdowns
    setCheckboxValue('enablePageTranslation', config.enablePageTranslation);
    initializeDropdown('sourceLanguage', languages, config.sourceLanguage);
    initializeDropdown('targetLanguage', languages, config.targetLanguage);

    const modelOptions = prebuiltAppConfig.model_list
        // @ts-ignore
        .sort((a,b)=>b.vram_required_MB-a.vram_required_MB)
        .map(model => createModelOption(model));

    initializeDropdown('modelName', modelOptions, config.modelName);

    // Save button handler
    const saveButton = document.getElementById('saveSettings');
    saveButton?.addEventListener('click', async () => {
        let config = updateConfig({
            enablePageTranslation: (document.getElementById('enablePageTranslation') as HTMLInputElement).checked,
            sourceLanguage: (document.getElementById('sourceLanguage') as HTMLInputElement).value,
            targetLanguage: (document.getElementById('targetLanguage') as HTMLInputElement).value,
            modelName: (document.getElementById('modelName') as HTMLInputElement).value
        });
        // Show confirmation message
        const status = document.getElementById('status');
        if (status) {
            status.textContent = 'Settings saved!';
            setTimeout(() => {
                status.textContent = '';
            }, 2000);
        }

        if (!config.enablePageTranslation) {
            // Send message to all active tabs
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.id) {
                        chrome.tabs.sendMessage(tab.id, { type: 'extensionDisabled' });
                    }
                });
            });
        }

    });

    //Reset button handler
    const resetButton = document.getElementById('resetSettings');
    resetButton?.addEventListener('click', async () => {
        // Import the default config and update UI
        const { defaultConfig } = await import('./config');

        // Update the UI dropdowns with default values
        setCheckboxValue('enablePageTranslation', defaultConfig.enablePageTranslation);
        setDropdownValue('sourceLanguage', defaultConfig.sourceLanguage);
        setDropdownValue('targetLanguage', defaultConfig.targetLanguage);
        setDropdownValue('modelName', defaultConfig.modelName);

        // Save the default config
        updateConfig({...defaultConfig});

        // Show confirmation message
        const status = document.getElementById('status');
        if (status) {
            status.textContent = 'Settings reset to default!';
            setTimeout(() => {
                status.textContent = '';
            }, 2000);
        }
    });


});

function setCheckboxValue(id: string,checked: boolean) {
    const input = document.getElementById(id) as HTMLInputElement;
    input.checked = checked;
}

function initializeDropdown(id: string, options: { value: string; label: string }[], initialValue: string): void {
    const hiddenInput = document.getElementById(id) as HTMLInputElement;
    const displayElement = document.getElementById(`${id}Display`) as HTMLElement;
    const searchInput = document.getElementById(`${id}Search`) as HTMLInputElement;
    const optionsContainer = document.getElementById(`${id}Options`) as HTMLElement;
    const dropdownContainer = displayElement.closest('.dropdown') as HTMLElement;

    let initialOption = options.find(option => option.value === initialValue);
    hiddenInput.value = initialOption && initialOption.value || '';
    displayElement.innerHTML = initialOption && initialOption.label || 'Select a item';

    // Initialize dropdown options
    populateOptions(options, optionsContainer, id);

    // Toggle dropdown on display click
    displayElement.addEventListener('click', () => {
        const isActive = dropdownContainer.classList.toggle('active');
        if (isActive) {
            searchInput.value = '';
            searchInput.focus();
            populateOptions(options, optionsContainer, id);
        }
    });

    // Handle search input
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredOptions = options.filter(option =>
            option.value.toLowerCase().includes(searchTerm)
        );
        populateOptions(filteredOptions, optionsContainer, id, searchTerm);
    });

    // Handle keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        const highlightedOption = optionsContainer.querySelector('.highlighted') as HTMLElement;
        const allOptions = optionsContainer.querySelectorAll('.dropdown-option');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!highlightedOption) {
                if (allOptions.length > 0) {
                    allOptions[0].classList.add('highlighted');
                    ensureVisible(allOptions[0] as HTMLElement, optionsContainer);
                }
            } else {
                const nextOption = highlightedOption.nextElementSibling as HTMLElement;
                if (nextOption && nextOption.classList.contains('dropdown-option')) {
                    highlightedOption.classList.remove('highlighted');
                    nextOption.classList.add('highlighted');
                    ensureVisible(nextOption, optionsContainer);
                }
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (highlightedOption) {
                const prevOption = highlightedOption.previousElementSibling as HTMLElement;
                if (prevOption && prevOption.classList.contains('dropdown-option')) {
                    highlightedOption.classList.remove('highlighted');
                    prevOption.classList.add('highlighted');
                    ensureVisible(prevOption, optionsContainer);
                }
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedOption && highlightedOption.dataset.value && highlightedOption.textContent) {
                selectOption({value: highlightedOption.dataset.value, label: highlightedOption.textContent}, id, dropdownContainer);
            }
        } else if (e.key === 'Escape') {
            dropdownContainer.classList.remove('active');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdownContainer.contains(e.target as Node)) {
            dropdownContainer.classList.remove('active');
        }
    });
}

function populateOptions(options: { value: string; label: string }[], container: HTMLElement, inputId: string, searchTerm: string = ''): void {
    container.innerHTML = '';

    if (options.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No matching found';
        container.appendChild(noResults);
        return;
    }

    options.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'dropdown-option';
        optionElement.dataset.value = option.value;

        // Highlight matching text if there's a search term
        if (searchTerm) {
            const lowerOption = option.label.toLowerCase();
            const index = lowerOption.indexOf(searchTerm.toLowerCase());
            if (index !== -1) {
                optionElement.innerHTML =
                    option.label.substring(0, index) +
                    '<strong>' + option.label.substring(index, index + searchTerm.length) + '</strong>' +
                    option.label.substring(index + searchTerm.length);
            } else {
                optionElement.innerHTML = option.label
            }
        } else {
            optionElement.innerHTML = option.label
        }

        optionElement.addEventListener('click', () => {
            const dropdownContainer = container.closest('.dropdown') as HTMLElement;
            selectOption(option, inputId, dropdownContainer);
        });

        container.appendChild(optionElement);
    });
}

function selectOption(option: { value: string; label: string }, inputId: string, dropdownContainer: HTMLElement): void {
    const hiddenInput = document.getElementById(inputId) as HTMLInputElement;
    const displayElement = document.getElementById(`${inputId}Display`) as HTMLElement;

    hiddenInput.value = option.value;
    displayElement.innerHTML = option.label;
    dropdownContainer.classList.remove('active');
}

function ensureVisible(element: HTMLElement, container: HTMLElement): void {
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    if (elementRect.bottom > containerRect.bottom) {
        container.scrollTop += elementRect.bottom - containerRect.bottom;
    } else if (elementRect.top < containerRect.top) {
        container.scrollTop -= containerRect.top - elementRect.top;
    }
}

function setDropdownValue(id: string, value: string): void {
    // Set the hidden input value
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) input.value = value;

    // Update the display text
    const display = document.getElementById(`${id}Display`);
    if (display) {
        // Find the option with matching value to get its label
        const options = id === 'modelName'
            ? prebuiltAppConfig.model_list.map(model => createModelOption(model))
            : languages;

        const option = options.find(opt => opt.value === value);
        if (option) {
            // For model we need to handle HTML differently
            if (id === 'modelName') {
                display.innerHTML = option.label;
            } else {
                display.textContent = option.label;
            }
        }
    }
}
