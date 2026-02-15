interface VideoTopicInput {
  count: number
  projectName: string
  topicDirection?: string
  existingYouTubeTopics: string[]
  existingTableTopics: string[]
}

export function buildVideoTopicPrompt(input: VideoTopicInput): string {
  const parts: string[] = []

  parts.push(`Generate exactly ${input.count} unique YouTube video topic ideas for "${input.projectName}".`)

  if (input.topicDirection) {
    parts.push(`Focus the topics on these subjects: ${input.topicDirection}.`)
  }

  parts.push("")
  parts.push("Requirements:")
  parts.push("- Each topic should be specific, engaging, and suitable for a YouTube video")
  parts.push("- Topics should be compelling and click-worthy as video titles")
  parts.push("- Include a mix of educational, how-to, and informational topics")

  const allExisting = [...input.existingYouTubeTopics, ...input.existingTableTopics]
  if (allExisting.length > 0) {
    parts.push("")
    parts.push("IMPORTANT: Do NOT suggest topics that overlap with these existing topics:")
    allExisting.forEach((t) => parts.push(`- ${t}`))
  }

  parts.push("")
  parts.push('Respond with a JSON array of objects. Each object must have a "title" field (string).')
  parts.push("Respond ONLY with the JSON array, no other text.")

  return parts.join("\n")
}

interface HooksInput {
  topics: string[]
  projectName: string
}

export function buildHooksPrompt(input: HooksInput): string {
  const parts: string[] = []

  parts.push(`Create engaging hooks and lead-ins for the following YouTube video topics for "${input.projectName}".`)
  parts.push("")
  parts.push("Topics:")
  input.topics.forEach((topic, i) => parts.push(`${i + 1}. ${topic}`))

  parts.push("")
  parts.push("Requirements:")
  parts.push("- For each topic, write 2-3 hook options (opening lines that grab attention)")
  parts.push("- Hooks should be conversational and create curiosity")
  parts.push("- Each hook should be 1-2 sentences that could open a YouTube video")
  parts.push("- Format with the topic title as a heading followed by the hooks")

  parts.push("")
  parts.push("Format the output as clean HTML with h2 tags for each topic title and p tags for hooks. Do not include <html>, <head>, or <body> tags.")

  return parts.join("\n")
}

interface DescriptionsInput {
  topics: string[]
  projectName: string
}

export function buildDescriptionsPrompt(input: DescriptionsInput): string {
  const parts: string[] = []

  parts.push(`Write YouTube video descriptions for the following video topics for "${input.projectName}".`)
  parts.push("")
  parts.push("Topics:")
  input.topics.forEach((topic, i) => parts.push(`${i + 1}. ${topic}`))

  parts.push("")
  parts.push("Requirements:")
  parts.push("- Each description should be 150-300 words")
  parts.push("- Include relevant keywords naturally for YouTube SEO")
  parts.push("- Include a brief summary of what the viewer will learn")
  parts.push("- End with a call-to-action (subscribe, like, comment)")
  parts.push("- Format with the topic title as a heading followed by the description")

  parts.push("")
  parts.push("Format the output as clean HTML with h2 tags for each topic title and p tags for descriptions. Do not include <html>, <head>, or <body> tags.")

  return parts.join("\n")
}

interface MiniBlogInput {
  transcription: string
  topicTitle: string
  projectName: string
}

export function buildMiniBlogPrompt(input: MiniBlogInput): string {
  const parts: string[] = []

  parts.push(`Write a mini-blog post based on the following video transcription for "${input.projectName}".`)
  parts.push(`The video topic is: "${input.topicTitle}"`)
  parts.push("")
  parts.push("--- TRANSCRIPTION START ---")
  parts.push(input.transcription)
  parts.push("--- TRANSCRIPTION END ---")

  parts.push("")
  parts.push("Requirements:")
  parts.push("- Write a 400-600 word blog post based on the key points from the transcription")
  parts.push("- Use proper heading hierarchy (H1, H2)")
  parts.push("- Make it SEO-friendly with natural keyword usage")
  parts.push("- Include an engaging introduction and conclusion")
  parts.push("- Keep the tone consistent with the video content")

  parts.push("")
  parts.push("Format the output as clean HTML with semantic tags (h1, h2, p, ul, li, strong, em). Do not include <html>, <head>, or <body> tags.")

  return parts.join("\n")
}
