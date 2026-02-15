import Anthropic from "@anthropic-ai/sdk"
import { LLMAdapter, LLMRequest, LLMResponse } from "./adapter"

export class AnthropicAdapter implements LLMAdapter {
  private client: Anthropic
  private model: string

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey })
    this.model = model || "claude-sonnet-4-5-20250929"
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: request.maxTokens ?? 4000,
      messages: [{ role: "user", content: request.prompt }],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    return {
      content: textBlock ? textBlock.text : "",
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
    }
  }
}
