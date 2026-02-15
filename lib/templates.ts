import { ContentRow } from "@/lib/store/content-store"

export interface ContentTemplate {
  name: string
  description: string
  rows: Omit<ContentRow, "id" | "status">[]
}

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    name: "Local Service Business",
    description: "Blog posts and service pages for a local business",
    rows: [
      {
        title: "Top 10 [Service] Tips for Homeowners",
        contentType: "BLOG_POST",
        serviceArea: "",
        targetAudience: "Homeowners",
        geolocation: "",
        targetKeywords: "",
        includeCta: true,
      },
      {
        title: "[Service] Services in [City]",
        contentType: "SERVICE_PAGE",
        serviceArea: "",
        targetAudience: "Local residents",
        geolocation: "",
        targetKeywords: "",
        includeCta: true,
      },
      {
        title: "Why Choose Us for [Service] in [City]",
        contentType: "ABOUT_PAGE",
        serviceArea: "",
        targetAudience: "Local residents",
        geolocation: "",
        targetKeywords: "",
        includeCta: true,
      },
      {
        title: "Frequently Asked Questions About [Service]",
        contentType: "FAQ_PAGE",
        serviceArea: "",
        targetAudience: "Homeowners",
        geolocation: "",
        targetKeywords: "",
        includeCta: false,
      },
    ],
  },
  {
    name: "Multi-Location SEO",
    description: "Location pages for businesses serving multiple areas",
    rows: [
      {
        title: "[Service] in [City] - Professional Solutions",
        contentType: "LOCATION_PAGE",
        serviceArea: "",
        targetAudience: "Local residents",
        geolocation: "City 1",
        targetKeywords: "",
        includeCta: true,
      },
      {
        title: "[Service] in [City] - Professional Solutions",
        contentType: "LOCATION_PAGE",
        serviceArea: "",
        targetAudience: "Local residents",
        geolocation: "City 2",
        targetKeywords: "",
        includeCta: true,
      },
      {
        title: "[Service] in [City] - Professional Solutions",
        contentType: "LOCATION_PAGE",
        serviceArea: "",
        targetAudience: "Local residents",
        geolocation: "City 3",
        targetKeywords: "",
        includeCta: true,
      },
    ],
  },
  {
    name: "Lead Generation Landing Pages",
    description: "High-converting landing pages for ad campaigns",
    rows: [
      {
        title: "Get a Free [Service] Quote Today",
        contentType: "LANDING_PAGE",
        serviceArea: "",
        targetAudience: "Homeowners needing urgent service",
        geolocation: "",
        targetKeywords: "",
        includeCta: true,
      },
      {
        title: "How to [Service Task]: A Complete Guide",
        contentType: "HOW_TO_GUIDE",
        serviceArea: "",
        targetAudience: "DIY enthusiasts",
        geolocation: "",
        targetKeywords: "",
        includeCta: true,
      },
    ],
  },
  {
    name: "Content Marketing Starter",
    description: "Mix of blog posts and guides for content marketing",
    rows: [
      {
        title: "The Ultimate Guide to [Service]",
        contentType: "HOW_TO_GUIDE",
        serviceArea: "",
        targetAudience: "",
        geolocation: "",
        targetKeywords: "",
        includeCta: true,
      },
      {
        title: "5 Signs You Need [Service]",
        contentType: "BLOG_POST",
        serviceArea: "",
        targetAudience: "Homeowners",
        geolocation: "",
        targetKeywords: "",
        includeCta: true,
      },
      {
        title: "[Service] vs [Alternative]: Which Is Right for You?",
        contentType: "BLOG_POST",
        serviceArea: "",
        targetAudience: "",
        geolocation: "",
        targetKeywords: "",
        includeCta: true,
      },
      {
        title: "What to Expect During a [Service] Appointment",
        contentType: "BLOG_POST",
        serviceArea: "",
        targetAudience: "First-time customers",
        geolocation: "",
        targetKeywords: "",
        includeCta: false,
      },
    ],
  },
]
