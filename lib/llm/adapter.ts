export interface LLMRequest {
  prompt: string
  maxTokens?: number
  temperature?: number
}

export interface LLMResponse {
  content: string
  tokensUsed?: number
}

export interface LLMAdapter {
  generate(request: LLMRequest): Promise<LLMResponse>
}

export type LLMProvider = "openai" | "anthropic" | "gemini"

export async function createAdapter(
  provider: LLMProvider,
  apiKey: string,
  model?: string
): Promise<LLMAdapter> {
  switch (provider) {
    case "openai": {
      const { OpenAIAdapter } = await import("./openai")
      return new OpenAIAdapter(apiKey, model)
    }
    case "anthropic": {
      const { AnthropicAdapter } = await import("./anthropic")
      return new AnthropicAdapter(apiKey, model)
    }
    case "gemini": {
      const { GeminiAdapter } = await import("./gemini")
      return new GeminiAdapter(apiKey, model)
    }
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`)
  }
}
