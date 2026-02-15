import { GoogleGenerativeAI } from "@google/generative-ai"
import { LLMAdapter, LLMRequest, LLMResponse } from "./adapter"

export class GeminiAdapter implements LLMAdapter {
  private genAI: GoogleGenerativeAI
  private modelName: string

  constructor(apiKey: string, model?: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.modelName = model || "gemini-1.5-pro"
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 4000,
        temperature: request.temperature ?? 0.7,
      },
    })

    const result = await model.generateContent(request.prompt)
    const response = result.response

    return {
      content: response.text(),
      tokensUsed: response.usageMetadata?.totalTokenCount,
    }
  }
}
