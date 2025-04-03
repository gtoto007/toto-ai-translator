import {
    CreateExtensionServiceWorkerMLCEngine,
    MLCEngineInterface,
    InitProgressReport,
    ChatCompletionRequestStreaming
} from "@mlc-ai/web-llm";

export default class WebLLM {

    private engine!: MLCEngineInterface;

    public static async createAsync(initProgressCallback: (report: InitProgressReport) => void, model: string = 'Llama-3.1-8B-Instruct-q4f16_1-MLC'): Promise<WebLLM> {
        const instance = new WebLLM();
        await instance.setup(model, initProgressCallback);
        return instance;
    }

    private async setup(model: string, initProgressCallback: (report: InitProgressReport) => void): Promise<void> {
        try {
            this.engine = await CreateExtensionServiceWorkerMLCEngine(model, {initProgressCallback: initProgressCallback},);
        } catch (error) {
            console.log("WEBLLM ERROR", error);
            this.sendWebLLMConnectionLostEvent();
            throw error;
        }

    }

    public async sendMessage(message: string, onResponseUpdate: (accumulatedResponse: string) => void) {
        try {
            console.log("sending message:", message);
            const options: ChatCompletionRequestStreaming = {
                stream: true,
                messages: [{role: "user", content: message}],
                response_format: {type: 'text'},
            }

            // Create a timeout promise that rejects after 10 seconds
            const timeoutPromise = new Promise<any>((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Translation request timed out after 10 seconds'));
                }, 3000);
            });

            // Race between the actual request and the timeout
            const streamingCompletion = await Promise.race([
                this.engine.chat.completions.create(options),
                timeoutPromise
            ]);

            // Update the answer as the model generates more text
            let accumulatedResponse = "";
            for await (const chunk of streamingCompletion) {
                const responseFragment = chunk.choices[0].delta.content;
                if (responseFragment) {
                    accumulatedResponse += responseFragment;
                }
                onResponseUpdate(accumulatedResponse);
            }
        } catch (error) {
            console.error('Error in sendMessage:', error);

            // Check if the error is related to a closed message port or timeout
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('port closed') ||
                errorMessage.includes('disconnected') ||
                errorMessage.includes('connection') ||
                errorMessage.includes('timed out') ||
                errorMessage.includes('terminated')) {

                // Notify the caller about the connection issue
                onResponseUpdate('Connection to the translation service was lost. Please try again.');

                // Dispatch a custom event that content.ts can listen for
                this.sendWebLLMConnectionLostEvent();
            } else {
                // For other errors, just pass the message to the caller
                onResponseUpdate('An error occurred during translation. Please try again.');
            }
        }
    }


    private sendWebLLMConnectionLostEvent() {
        window.dispatchEvent(new CustomEvent('webllm-connection-lost'));
    }
}
