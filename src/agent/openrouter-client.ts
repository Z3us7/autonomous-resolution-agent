export interface OpenRouterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  name?: string; // used for tool responses
  tool_calls?: any[]; // when assistant calls a tool
  tool_call_id?: string; // when providing tool result
}

export interface OpenRouterTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

export class OpenRouterClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
  }

  public async generateContent(
    messages: OpenRouterMessage[],
    tools: OpenRouterTool[]
  ): Promise<any> {
    if (!this.apiKey) throw new Error("OPENROUTER_API_KEY missing in environment variables");

    const url = "https://openrouter.ai/api/v1/chat/completions";
    
    // Fallback list of free models in case of shared-pool 429s or 404s
    const fallbackModels = [
      "meta-llama/llama-3.1-8b-instruct:free",
      "nvidia/nemotron-3.5-lightning:free",
      "google/gemma-2-9b-it:free",
      "google/gemma-4-31b-it:free",
      "poolside/laguna-s-2.1:free"
    ];

    let lastError = null;

    for (const model of fallbackModels) {
      try {
        const body = {
          model: model,
          messages,
          tools,
          tool_choice: "auto"
        };

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Autonomous Support Agent"
          },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errorText = await res.text();
          // If it's a 429 or 404, we continue to the next model
          if (res.status === 429 || res.status === 404 || res.status === 502) {
             lastError = `Model ${model} failed with ${res.status}: ${errorText}`;
             continue;
          }
          throw new Error(`OpenRouter API Error: ${errorText}`);
        }

        const data = await res.json();
        return data.choices[0].message;
      } catch (e: any) {
         lastError = e.message;
      }
    }

    throw new Error(`All free models failed. Last error: ${lastError}`);
  }
}
