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
        console.log("WEBLLM INITIALIZED");
        return instance;
    }

    private async setup(model: string, initProgressCallback: (report: InitProgressReport) => void): Promise<void> {
        this.engine = await CreateExtensionServiceWorkerMLCEngine(model, {initProgressCallback: initProgressCallback},);
    }

    public async sendMessage(message: string, onResponseUpdate: (accumulatedResponse: string) => void) {

        const options:ChatCompletionRequestStreaming={
            stream: true,
            messages: [{role: "user", content: message}],
            response_format: {type: 'text'},
        }
        const streamingCompletion = await this.engine.chat.completions.create(options);
        console.log("sending message...");

        // Update the answer as the model generates more text
        let accumulatedResponse = "";
        for await (const chunk of streamingCompletion) {
            const responseFragment = chunk.choices[0].delta.content;
            if (responseFragment) {
                accumulatedResponse += responseFragment;
            }
            onResponseUpdate(accumulatedResponse);
        }

    }


}
