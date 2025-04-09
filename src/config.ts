// Configuration interface for the translator
export interface Config {
    sourceLanguage: string;
    targetLanguage: string;
    preserveTechnicalTerms: boolean;
    modelName: string;
}

// Default configuration
export const defaultConfig: Config = {
    sourceLanguage: 'English',
    targetLanguage: 'Italian',
    preserveTechnicalTerms: true,
    modelName: 'Llama-3.1-8B-Instruct-q4f16_1-MLC'
};

// Current configuration (initialized with defaults)
let currentConfig: Config;

export async function getConfig():  Promise<Config> {
    if( currentConfig === undefined){
        currentConfig = await loadConfig();
    }
    return { ...currentConfig };
}

/**
 * Update the configuration
 * @param newConfig - New configuration values to apply
 */
export function updateConfig(newConfig: Partial<Config>): Config {
    currentConfig = { ...currentConfig, ...newConfig };
    saveConfig();
    return currentConfig;
}

/**
 * Save configuration to storage
 */
function saveConfig(): void {
    chrome.storage.sync.set({ config: currentConfig });
}


/**
 * Load configuration from storage
 */
export async function loadConfig(): Promise<Config> {
    return new Promise((resolve) => {
        chrome.storage.sync.get('config', (result) => {
            if (result.config) {
                currentConfig = { ...defaultConfig, ...result.config };
            }else{
                currentConfig ={ ...defaultConfig }
            }
            resolve(currentConfig);
        });
    });
}

