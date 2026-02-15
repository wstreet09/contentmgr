interface ContentPromptInput {
  title: string
  contentType: string
  serviceArea?: string
  targetAudience?: string
  geolocation?: string
  targetKeywords?: string
  includeCta: boolean
  businessName?: string
  wordCount?: number
  templatePrompt?: string
  exampleContent?: string
  customPromptInstruction?: string
}

export const PROMPT_TEMPLATES: { value: string; label: string; instruction: string }[] = [
  {
    value: "default",
    label: "Default (SEO-Optimized)",
    instruction: "Write in a professional but approachable tone",
  },
  {
    value: "conversational",
    label: "Conversational",
    instruction: "Write in a warm, conversational tone as if speaking directly to the reader. Use short sentences, rhetorical questions, and relatable examples",
  },
  {
    value: "technical",
    label: "Technical / In-Depth",
    instruction: "Write in an authoritative, technical tone. Include detailed explanations, data points, and expert-level insights. Prioritize depth over brevity",
  },
  {
    value: "listicle",
    label: "Listicle",
    instruction: "Structure the content as a numbered list with a brief intro and conclusion. Each list item should have a bold heading and 2-3 sentences of explanation",
  },
  {
    value: "local-seo",
    label: "Local SEO",
    instruction: "Emphasize local relevance throughout. Reference the geographic area, local landmarks, community aspects, and location-specific details. Optimize heavily for local search",
  },
]

const CONTENT_TYPE_LABELS: Record<string, string> = {
  BLOG_POST: "blog post",
  SERVICE_PAGE: "service page",
  LOCATION_PAGE: "location-specific landing page",
  LANDING_PAGE: "high-converting landing page",
  ABOUT_PAGE: "about us page",
  FAQ_PAGE: "FAQ page",
  HOW_TO_GUIDE: "how-to guide",
}

export function buildContentPrompt(input: ContentPromptInput): string {
  const typeLabel = CONTENT_TYPE_LABELS[input.contentType] || "web page"

  const parts: string[] = [
    `Write a professional, SEO-optimized ${typeLabel} with the title: "${input.title}".`,
  ]

  if (input.businessName) {
    parts.push(`The business name is "${input.businessName}".`)
  }

  if (input.serviceArea) {
    parts.push(`The primary service area is: ${input.serviceArea}.`)
  }

  if (input.targetAudience) {
    parts.push(`The target audience is: ${input.targetAudience}.`)
  }

  if (input.geolocation) {
    parts.push(`This content targets the geographic area: ${input.geolocation}. Include local references where appropriate.`)
  }

  if (input.targetKeywords) {
    parts.push(`Naturally incorporate these keywords: ${input.targetKeywords}.`)
  }

  const template = PROMPT_TEMPLATES.find((t) => t.value === input.templatePrompt) || PROMPT_TEMPLATES[0]
  const targetWords = input.wordCount || 800

  parts.push("")
  parts.push("Requirements:")

  if (input.exampleContent) {
    parts.push("- Match the writing style, tone, and structure of the following example content:")
    parts.push("")
    parts.push("--- EXAMPLE START ---")
    parts.push(input.exampleContent)
    parts.push("--- EXAMPLE END ---")
    parts.push("")
  } else if (input.customPromptInstruction) {
    parts.push(`- ${input.customPromptInstruction}`)
  } else {
    parts.push(`- ${template.instruction}`)
  }
  parts.push("- Use proper heading hierarchy (H1, H2, H3)")
  parts.push("- Include an engaging introduction and conclusion")
  parts.push("- Optimize for search engines while keeping content reader-friendly")
  parts.push(`- Content should be approximately ${targetWords} words`)

  if (input.includeCta) {
    parts.push("- Include a compelling call-to-action section at the end, wrapped in its own paragraph tags with clear separation from surrounding content")
  }

  parts.push("- After all article content (including the CTA if present), add a horizontal rule (<hr>) followed by the meta description (150-160 characters) that leads with the primary keyword. Format it as: <hr><p><strong>Meta Description:</strong> [description text]</p>")

  parts.push("")
  parts.push("Format the output as clean HTML with semantic tags (h1, h2, h3, p, ul, li, strong, em). Do not include <html>, <head>, or <body> tags — only the content body.")

  return parts.join("\n")
}

interface TopicSuggestionInput {
  count: number
  businessName: string
  companyType?: string
  city?: string
  state?: string
  existingWebsiteTopics: string[]
  existingTableTopics: string[]
  topicDirection?: string
}

export function buildTopicSuggestionPrompt(input: TopicSuggestionInput): string {
  const parts: string[] = []

  parts.push(`Generate exactly ${input.count} unique blog post topic ideas for "${input.businessName}".`)

  if (input.companyType) {
    parts.push(`This is a ${input.companyType} business.`)
  }
  if (input.city && input.state) {
    parts.push(`Located in ${input.city}, ${input.state}.`)
  } else if (input.city) {
    parts.push(`Located in ${input.city}.`)
  }

  if (input.topicDirection) {
    parts.push(`Focus the topics on these subjects: ${input.topicDirection}.`)
  }

  parts.push("")
  parts.push("Requirements:")
  parts.push("- Each topic should be specific, SEO-friendly, and relevant to the business")
  parts.push("- Topics should target different search intents (informational, commercial, local)")
  parts.push("- Include a mix of evergreen and timely topics")
  parts.push("- Each topic title should be compelling and click-worthy")

  const allExisting = [...input.existingWebsiteTopics, ...input.existingTableTopics]
  if (allExisting.length > 0) {
    parts.push("")
    parts.push("IMPORTANT: Do NOT suggest topics that overlap with these existing topics:")
    allExisting.forEach((t) => parts.push(`- ${t}`))
  }

  parts.push("")
  parts.push("Respond with a JSON array of objects. Each object must have these fields:")
  parts.push('- "title": string (the blog post title)')
  parts.push('- "targetKeywords": string (2-3 comma-separated SEO keywords)')
  parts.push('- "targetAudience": string (who this post is for)')
  parts.push("")
  parts.push("Respond ONLY with the JSON array, no other text.")

  return parts.join("\n")
}
