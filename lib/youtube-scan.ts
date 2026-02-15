export interface YouTubeVideo {
  title: string
}

/**
 * Extract channel ID from various YouTube URL formats.
 * Supports: /channel/ID, /@handle, /c/name, /user/name
 */
async function resolveChannelId(channelUrl: string): Promise<string | null> {
  try {
    const url = new URL(channelUrl)

    // Direct channel ID: youtube.com/channel/UCxxxx
    const channelMatch = url.pathname.match(/\/channel\/(UC[\w-]+)/)
    if (channelMatch) return channelMatch[1]

    // For @handle, /c/, or /user/ URLs, we need to scrape the page
    // to find the channel ID in the page source
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    try {
      const res = await fetch(channelUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "ContentGenerator/1.0" },
      })
      if (!res.ok) return null

      const html = await res.text()

      // Look for channel ID in the page HTML
      const idMatch = html.match(/"channelId":"(UC[\w-]+)"/) ||
                       html.match(/channel_id=(UC[\w-]+)/) ||
                       html.match(/<meta\s+itemprop="channelId"\s+content="(UC[\w-]+)"/)
      if (idMatch) return idMatch[1]
    } finally {
      clearTimeout(timeout)
    }

    return null
  } catch {
    return null
  }
}

/**
 * Scan a YouTube channel's RSS feed to get existing video titles.
 * Returns an array of video titles (capped at 200).
 */
export async function scanYouTubeChannel(channelUrl: string): Promise<YouTubeVideo[]> {
  if (!channelUrl) return []

  const channelId = await resolveChannelId(channelUrl)
  if (!channelId) return []

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "ContentGenerator/1.0" },
    })

    if (!res.ok) return []

    const xml = await res.text()
    const videos: YouTubeVideo[] = []

    // Extract <title> elements from RSS feed entries
    const titleRegex = /<entry>[\s\S]*?<title>([\s\S]*?)<\/title>/g
    let match
    while ((match = titleRegex.exec(xml)) !== null) {
      const title = match[1].trim()
      if (title) {
        videos.push({ title })
      }
    }

    return videos.slice(0, 200)
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}
