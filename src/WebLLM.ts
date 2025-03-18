import {
    CreateExtensionServiceWorkerMLCEngine,
    MLCEngineInterface,
    InitProgressReport,
    ChatCompletionMessageParam,
    ResponseFormat
  } from "@mlc-ai/web-llm";

export default class WebLLM {

    private engine: MLCEngineInterface;

    public static createAsync(initProgressCallback,model:string = 'Llama-3.1-8B-Instruct-q4f16_1-MLC'): WebLLM{
       const instance = new WebLLM();
       instance.setup(model,initProgressCallback);
       console.log("WEBLLM INITIALIZED");
       return instance;
    }
    async setup(model,initProgressCallback) {
         this.engine= await CreateExtensionServiceWorkerMLCEngine(
            model,
            { initProgressCallback: initProgressCallback },
          );
    }

    public async sendMessage(message: string, callback) {
        const messages: ChatCompletionMessageParam[] = [];
      
        messages.push({ role: "user", content: message });
      
         let curMessage = "";
         const completion = await this.engine.chat.completions.create({
           stream: true,
           messages: messages,
           response_format: { type: 'text' },
         });
         console.log("sending message...");
       
         // Update the answer as the model generates more text
         for await (const chunk of completion) {
      
           const curDelta = chunk.choices[0].delta.content;
           if (curDelta) {
             curMessage += curDelta;
           }
           callback(curMessage);
         }
         message= await this.engine.getMessage();
         messages.push({ role: "assistant", content: await this.engine.getMessage() });
      }
      


}