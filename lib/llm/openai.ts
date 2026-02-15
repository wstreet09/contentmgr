import OpenAI from "openai"
import { LLMAdapter, LLMRequest, LLMResponse } from "./adapter"

export class OpenAIAdapter implements LLMAdapter {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({ apiKey })
    this.model = model || "gpt-4o"
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const isReasoning = this.model.startsWith("o") || this.model.startsWith("gpt-5")
    // Reasoning models need much higher token limits since reasoning tokens count toward the limit
    const tokens = isReasoning ? Math.max((request.maxTokens ?? 4000) * 4, 16000) : (request.maxTokens ?? 4000)
    const useNewParam = isReasoning || this.model.startsWith("gpt-4o") || this.model.startsWith("gpt-4.1")
    // Reasoning models (o-series, gpt-5) use "developer" role instead of "system"
    const systemRole = isReasoning ? "developer" : "system"

    let completion
    try {
      completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: systemRole as "system", content: "You are a professional content writer. Always respond with the requested content directly." },
          { role: "user", content: request.prompt },
        ],
        ...(useNewParam ? { max_completion_tokens: tokens } : { max_tokens: tokens }),
        ...(!isReasoning && { temperature: request.temperature ?? 0.7 }),
      })
    } catch (apiErr) {
      console.error(`[OpenAI] API error for model ${this.model}:`, apiErr)
      throw apiErr
    }

    console.log(`[OpenAI] Model: ${this.model}, finish_reason: ${completion.choices[0]?.finish_reason}, content length: ${completion.choices[0]?.message?.content?.length ?? 'null'}`)

    const content = completion.choices[0]?.message?.content || ""
    if (!content) {
      throw new Error(`Model ${this.model} returned empty content. Try a different model.`)
    }

    return {
      content,
      tokensUsed: completion.usage?.total_tokens,
    }
  }
}
