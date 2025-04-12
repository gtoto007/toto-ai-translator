// Configuration interface for the translator
export interface Config {
    sourceLanguage: string;
    targetLanguage: string;
    modelName: string;
}

// Default configuration
export const defaultConfig: Config = {
    sourceLanguage: 'English',
    targetLanguage: 'Italian',
    modelName: 'Llama-3.1-8B-Instruct-q4f16_1-MLC'
};


export async function getConfig(): Promise<Config> {
    return await new Promise((resolve) => {
        chrome.storage.sync.get('config', (result) => {
            console.log(result);
            if (result.config) {
                console.log("config",{...defaultConfig, ...result.config})
                resolve({...defaultConfig, ...result.config});
            } else {
                resolve({...defaultConfig})
            }
        });
    });
}

/**
 * Update the configuration
 * @param newConfig - New configuration values to apply
 */
export function updateConfig(newConfig: Config) {
    chrome.storage.sync.set({config: {...newConfig}});
}

