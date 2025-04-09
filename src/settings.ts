// settings.ts
import {getConfig, updateConfig, Config} from './config';
import {prebuiltAppConfig} from "@mlc-ai/web-llm";


const languages = [
    {id: "English", label: "English"},
    {id: "Chinese", label: "Chinese"},
    {id: "Spanish", label: "Spanish"},
    {id: "Arabic", label: "Arabic"},
    {id: "Hindi", label: "Hindi"},
    {id: "Bengali", label: "Bengali"},
    {id: "Portuguese", label: "Portuguese"},
    {id: "Russian", label: "Russian"},
    {id: "Japanese", label: "Japanese"},
    {id: "German", label: "German"},
    {id: "French", label: "French"},
    {id: "Italian", label: "Italian"},
    {id: "Dutch", label: "Dutch"},
    {id: "Korean", label: "Korean"},
    {id: "Turkish", label: "Turkish"},
    {id: "Vietnamese", label: "Vietnamese"},
    {id: "Polish", label: "Polish"},
    {id: "Ukrainian", label: "Ukrainian"},
    {id: "Persian", label: "Persian"},
    {id: "Indonesian", label: "Indonesian"},
    {id: "Malay", label: "Malay"},
    {id: "Thai", label: "Thai"},
    {id: "Swedish", label: "Swedish"},
    {id: "Norwegian", label: "Norwegian"},
    {id: "Danish", label: "Danish"},
    {id: "Finnish", label: "Finnish"},
    {id: "Greek", label: "Greek"},
    {id: "Czech", label: "Czech"},
    {id: "Romanian", label: "Romanian"},
    {id: "Hungarian", label: "Hungarian"},
    {id: "Hebrew", label: "Hebrew"},
    {id: "Bulgarian", label: "Bulgarian"},
    {id: "Slovak", label: "Slovak"},
    {id: "Croatian", label: "Croatian"},
    {id: "Serbian", label: "Serbian"},
    {id: "Urdu", label: "Urdu"},
    {id: "Swahili", label: "Swahili"},
    {id: "Tamil", label: "Tamil"},
    {id: "Telugu", label: "Telugu"},
    {id: "Marathi", label: "Marathi"},
    {id: "Kannada", label: "Kannada"}
];


document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOMContentLoaded settings.ts");
    console.log(prebuiltAppConfig.model_list)
    const config = await getConfig();

    // Initialize language dropdowns
    initializeLanguageDropdown('sourceLanguage', languages, config.sourceLanguage);
    initializeLanguageDropdown('targetLanguage', languages, config.targetLanguage);

    // Initialize model dropdown
    console.log(prebuiltAppConfig.model_list)
    const modelOptions = prebuiltAppConfig.model_list.map(model => {
        // Format RAM size
        let ramSize: string;
        if (model.vram_required_MB >= 1024) {
            ramSize = `${(model.vram_required_MB / 1024).toFixed(1)}GB`;
        } else {
            ramSize = `${model.vram_required_MB.toLocaleString()}MB`;
        }

        return {
            value: model.model_id,
            // If your dropdown supports HTML content:
            label: `<div class="model-option">
                  <span class="model-name">${model.model_id}</span>
                  <span class="model-ram">${ramSize} RAM</span>
                </div>`
            // If HTML is not supported:
            // label: `${model.model_id} (${ramSize})`
        };
    });

    initializeLanguageDropdown('modelName', modelOptions, config.modelName);

    // Save button handler
    const saveButton = document.getElementById('saveSettings');
    saveButton?.addEventListener('click', async () => {
        const newConfig: Partial<Config> = {
            sourceLanguage: (document.getElementById('sourceLanguage') as HTMLInputElement).value,
            targetLanguage: (document.getElementById('targetLanguage') as HTMLInputElement).value,
            modelName: (document.getElementById('modelName') as HTMLInputElement).value
        };

        updateConfig(newConfig);
        // Show confirmation message
        const status = document.getElementById('status');
        if (status) {
            status.textContent = 'Settings saved!';
            setTimeout(() => {
                status.textContent = '';
            }, 2000);
        }
    });
});

function initializeLanguageDropdown(id: string, options: { value: string; label: string }[], initialValue: string): void {
    const hiddenInput = document.getElementById(id) as HTMLInputElement;
    const displayElement = document.getElementById(`${id}Display`) as HTMLElement;
    const searchInput = document.getElementById(`${id}Search`) as HTMLInputElement;
    const optionsContainer = document.getElementById(`${id}Options`) as HTMLElement;
    const dropdownContainer = displayElement.closest('.dropdown') as HTMLElement;

    // Set initial value
    hiddenInput.value = initialValue || '';
    displayElement.textContent = initialValue || 'Select a language';

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
        noResults.textContent = 'No matching languages found';
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
    displayElement.textContent = option.label;
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
