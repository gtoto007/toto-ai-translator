import {
    CreateExtensionServiceWorkerMLCEngine,
    MLCEngineInterface,
    InitProgressReport,
    ChatCompletionRequestStreaming,
} from "@mlc-ai/web-llm";

export default class WebLLM {

    private engine!: MLCEngineInterface;

    public modelName!: string;

    public static async createAsync(initProgressCallback: (report: InitProgressReport) => void, model: string = 'Llama-3.1-8B-Instruct-q4f16_1-MLC'): Promise<WebLLM> {
        const instance = new WebLLM();
        await instance.setup(model, initProgressCallback);
        return instance;
    }

    private async setup(modelName: string, initProgressCallback: (report: InitProgressReport) => void): Promise<void> {
        try {
            this.modelName =modelName;
            this.engine = await CreateExtensionServiceWorkerMLCEngine(modelName, {initProgressCallback: initProgressCallback},);
        } catch (error) {
            console.log("WEBLLM ERROR", error);
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
                }, 10000);
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
            throw error;
        }
    }

    //
    private sendWebLLMConnectionLostEvent() {
        window.dispatchEvent(new CustomEvent('webllm-connection-lost'));
    }
}
