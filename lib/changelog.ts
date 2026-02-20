export interface ChangelogEntry {
  date: string
  title: string
  description: string
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-02-20",
    title: "What's New Notifications",
    description:
      "Stay up to date with the latest app changes via the bell icon in the header.",
  },
  {
    date: "2026-02-20",
    title: "Internal & External Linking",
    description:
      "Articles now include up to 2 internal links from your sitemap and manual list, plus up to 2 authoritative external links.",
  },
  {
    date: "2026-02-20",
    title: "Status Filter",
    description:
      "Filter your content table by status — Completed, Draft, Generating, or Failed.",
  },
  {
    date: "2026-02-19",
    title: "Custom Prompt Instructions",
    description:
      "Add reusable custom prompt instructions per location for fine-tuned content generation.",
  },
  {
    date: "2026-02-19",
    title: "Content Examples",
    description:
      "Save example content per location and use it as a style reference when generating articles.",
  },
  {
    date: "2026-02-18",
    title: "AI Topic Suggestions",
    description:
      "Suggest blog topics with AI — scans your sitemap to avoid duplicates and generates SEO-friendly ideas.",
  },
  {
    date: "2026-02-17",
    title: "Google Drive Integration",
    description:
      "Connect Google Drive to automatically save generated articles as Google Docs in your chosen folder.",
  },
  {
    date: "2026-02-16",
    title: "Bulk Content Generation",
    description:
      "Generate multiple articles at once with real-time progress tracking and batch management.",
  },
]
