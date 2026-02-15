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

export async function scrapeSitemap(urlInput: string): Promise<SitemapEntry[]> {
  const base = urlInput.replace(/\/+$/, "")
  const isDirectSitemap = base.endsWith(".xml")
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    // Fetch sitemap — use URL directly if it ends in .xml, otherwise append /sitemap.xml
    const sitemapUrl = isDirectSitemap ? base : `${base}/sitemap.xml`
    const sitemapRes = await fetch(sitemapUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "ContentGenerator/1.0" },
    })

    if (sitemapRes.ok) {
      const xml = await sitemapRes.text()
      const entries = extractEntriesFromSitemap(xml)
      if (entries.length > 0) {
        return entries.slice(0, 100)
      }
    }

    // Fallback: scrape /blog/ page
    const blogRes = await fetch(`${base}/blog`, {
      signal: controller.signal,
      headers: { "User-Agent": "ContentGenerator/1.0" },
    })

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
