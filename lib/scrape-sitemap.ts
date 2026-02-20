export interface SitemapEntry {
  url: string
  title: string
}

function slugToTitle(slug: string): string {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function isBlogLikePath(path: string): boolean {
  const lower = path.toLowerCase()
  return (
    lower.includes("/blog") ||
    lower.includes("/post") ||
    lower.includes("/article") ||
    lower.includes("/news") ||
    lower.includes("/resource")
  )
}

function extractEntriesFromSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = []
  const locRegex = /<loc>(.*?)<\/loc>/g
  let match

  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim()
    // Skip XML sitemap URLs — only want actual page URLs
    if (url.endsWith(".xml")) continue
    if (!isBlogLikePath(url)) continue

    try {
      const parsed = new URL(url)
      const segments = parsed.pathname.split("/").filter(Boolean)
      const lastSegment = segments[segments.length - 1]
      if (!lastSegment || lastSegment === "blog") continue
      entries.push({ url, title: slugToTitle(lastSegment) })
    } catch {
      continue
    }
  }

  return entries
}

/** Check if XML is a sitemap index (contains <sitemapindex> or <sitemap> tags) */
function isSitemapIndex(xml: string): boolean {
  return xml.includes("<sitemapindex") || (xml.includes("<sitemap>") && !xml.includes("<urlset"))
}

/** Extract sub-sitemap URLs from a sitemap index */
function extractSubSitemapUrls(xml: string): string[] {
  const urls: string[] = []
  const locRegex = /<loc>(.*?)<\/loc>/g
  let match
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim()
    if (url.endsWith(".xml")) {
      urls.push(url)
    }
  }
  return urls
}

function extractEntriesFromHtml(html: string, baseUrl: string): SitemapEntry[] {
  const entries: SitemapEntry[] = []
  const linkRegex = /<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi
  let match

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    const text = match[2].replace(/<[^>]*>/g, "").trim()
    if (!href || !text) continue

    try {
      const fullUrl = href.startsWith("http") ? href : new URL(href, baseUrl).toString()
      if (isBlogLikePath(fullUrl) && text.length > 5 && text.length < 200) {
        entries.push({ url: fullUrl, title: text })
      }
    } catch {
      continue
    }
  }

  return entries
}

async function fetchWithTimeout(url: string, signal: AbortSignal): Promise<Response> {
  return fetch(url, {
    signal,
    headers: { "User-Agent": "ContentGenerator/1.0" },
  })
}

export async function scrapeSitemap(urlInput: string): Promise<SitemapEntry[]> {
  const base = urlInput.replace(/\/+$/, "")
  const isDirectSitemap = base.endsWith(".xml")
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const sitemapUrl = isDirectSitemap ? base : `${base}/sitemap.xml`
    const sitemapRes = await fetchWithTimeout(sitemapUrl, controller.signal)

    if (sitemapRes.ok) {
      const xml = await sitemapRes.text()

      // If this is a sitemap index, fetch the sub-sitemaps
      if (isSitemapIndex(xml)) {
        const subUrls = extractSubSitemapUrls(xml)
        const allEntries: SitemapEntry[] = []

        // Fetch up to 5 sub-sitemaps to avoid timeout
        for (const subUrl of subUrls.slice(0, 5)) {
          try {
            const subRes = await fetchWithTimeout(subUrl, controller.signal)
            if (subRes.ok) {
              const subXml = await subRes.text()
              allEntries.push(...extractEntriesFromSitemap(subXml))
            }
          } catch {
            // Skip failed sub-sitemaps
          }
          if (allEntries.length >= 100) break
        }

        if (allEntries.length > 0) {
          return allEntries.slice(0, 100)
        }
      }

      // Regular sitemap (not an index)
      const entries = extractEntriesFromSitemap(xml)
      if (entries.length > 0) {
        return entries.slice(0, 100)
      }
    }

    // Fallback: scrape /blog/ page
    const blogRes = await fetchWithTimeout(`${base}/blog`, controller.signal)

    if (blogRes.ok) {
      const html = await blogRes.text()
      return extractEntriesFromHtml(html, base).slice(0, 100)
    }

    return []
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}
