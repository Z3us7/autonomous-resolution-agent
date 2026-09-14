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
    
    // Best free models for tool calling, ordered by capability + speed.
    // openrouter/auto is first — it's OpenRouter's own intelligent free router
    // that automatically picks the best available free model with tool support.
    const fallbackModels = [
      "openrouter/auto",                        // OpenRouter's own smart free router (best option)
      "qwen/qwen3-coder:free",                  // Qwen3 Coder — best free model for agentic tool calling
      "google/gemma-4-31b-it:free",             // Gemma 31B — strong at following tool schemas
      "qwen/qwen3-30b-a3b:free",               // Qwen3 30B MoE — fast & smart
      "microsoft/mai-ds-r1:free",               // Microsoft MAI reasoning model
      "meta-llama/llama-3.3-70b-instruct:free", // LLaMA 3.3 70B — very capable
      "google/gemma-4-26b-a4b-it:free",         // Gemma 26B fallback
      "meta-llama/llama-3.1-8b-instruct:free",  // Fast lightweight fallback
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
            "HTTP-Referer": "https://autonomous-resolution-agent-rho.vercel.app",
            "X-Title": "Autonomous Support Agent"
          },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errorText = await res.text();
          // On 429 (rate limit), 404 (model gone), or 502 (upstream error), try next model
          if (res.status === 429 || res.status === 404 || res.status === 502 || res.status === 503) {
             lastError = `Model ${model} failed with ${res.status}: ${errorText}`;
             continue;
          }
          throw new Error(`OpenRouter API Error: ${errorText}`);
        }

        const data = await res.json();
        return data.choices[0].message;
      } catch (e: any) {
         lastError = e.message;
         // If it's a network error, try the next model
         continue;
      }
    }

    throw new Error(`All models failed. Last error: ${lastError}`);
  }
}
