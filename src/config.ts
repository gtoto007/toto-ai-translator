// Configuration interface for the translator
export interface Config {
    sourceLanguage: string;
    targetLanguage: string;
    modelName: string;
}

// Default configuration
export const defaultConfig: Config = {
    sourceLanguage: 'English',
    targetLanguage: getBrowserLanguage() =='English' ? 'Italian' : getBrowserLanguage(),
    modelName: 'Llama-3.1-8B-Instruct-q4f16_1-MLC'
};

function getBrowserLanguage(): string {
    let langCode = '';

    // Try to get language via Chrome extension API
    try {
        if (chrome.i18n && chrome.i18n.getUILanguage) {
            langCode = chrome.i18n.getUILanguage();
        }
    } catch (e) {
        console.warn('Could not access chrome.i18n API:', e);
    }

    // Fallback to navigator.language if chrome.i18n is unavailable
    if (!langCode && navigator) {
        langCode = navigator.language || (navigator as any).userLanguage || '';
    }

    langCode = langCode.split('-')[0];

    // Map language codes to full language names
    const languageMap: {[key: string]: string} = {
        'en': 'English',
        'zh': 'Chinese',
        'es': 'Spanish',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'bn': 'Bengali',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ja': 'Japanese',
        'de': 'German',
        'fr': 'French',
        'it': 'Italian',
        'nl': 'Dutch',
        'ko': 'Korean',
        'tr': 'Turkish',
        'vi': 'Vietnamese',
        'pl': 'Polish',
        'uk': 'Ukrainian',
        'fa': 'Persian',
        'id': 'Indonesian',
        'ms': 'Malay',
        'th': 'Thai',
        'sv': 'Swedish',
        'no': 'Norwegian',
        'da': 'Danish',
        'fi': 'Finnish',
        'el': 'Greek',
        'cs': 'Czech',
        'ro': 'Romanian',
        'hu': 'Hungarian',
        'he': 'Hebrew',
        'bg': 'Bulgarian',
        'sk': 'Slovak',
        'hr': 'Croatian',
        'sr': 'Serbian',
        'ur': 'Urdu',
        'sw': 'Swahili',
        'ta': 'Tamil',
        'te': 'Telugu',
        'mr': 'Marathi',
        'kn': 'Kannada'
    };

    return languageMap[langCode] || 'English';
}



export async function getConfig(): Promise<Config> {
    return await new Promise((resolve) => {
        chrome.storage.sync.get('config', (result) => {
            if (result.config) {
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

