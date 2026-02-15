import { describe, it, expect } from "vitest"
import { buildContentPrompt, buildTopicSuggestionPrompt } from "@/lib/llm/prompts"

describe("buildContentPrompt", () => {
  it("includes the title and content type", () => {
    const prompt = buildContentPrompt({
      title: "Best Plumbing Tips",
      contentType: "BLOG_POST",
      includeCta: true,
    })
    expect(prompt).toContain("Best Plumbing Tips")
    expect(prompt).toContain("blog post")
  })

  it("includes service area when provided", () => {
    const prompt = buildContentPrompt({
      title: "Test",
      contentType: "SERVICE_PAGE",
      serviceArea: "Plumbing",
      includeCta: true,
    })
    expect(prompt).toContain("Plumbing")
    expect(prompt).toContain("service page")
  })

  it("includes geolocation when provided", () => {
    const prompt = buildContentPrompt({
      title: "Test",
      contentType: "LOCATION_PAGE",
      geolocation: "Austin, TX",
      includeCta: true,
    })
    expect(prompt).toContain("Austin, TX")
    expect(prompt).toContain("geographic area")
  })

  it("includes CTA instruction when includeCta is true", () => {
    const prompt = buildContentPrompt({
      title: "Test",
      contentType: "BLOG_POST",
      includeCta: true,
    })
    expect(prompt).toContain("call-to-action")
  })

  it("excludes CTA instruction when includeCta is false", () => {
    const prompt = buildContentPrompt({
      title: "Test",
      contentType: "BLOG_POST",
      includeCta: false,
    })
    expect(prompt).not.toContain("call-to-action")
  })

  it("includes keywords when provided", () => {
    const prompt = buildContentPrompt({
      title: "Test",
      contentType: "BLOG_POST",
      targetKeywords: "plumber near me, emergency plumbing",
      includeCta: true,
    })
    expect(prompt).toContain("plumber near me")
  })

  it("includes business name when provided", () => {
    const prompt = buildContentPrompt({
      title: "Test",
      contentType: "ABOUT_PAGE",
      businessName: "Acme Plumbing",
      includeCta: true,
    })
    expect(prompt).toContain("Acme Plumbing")
  })

  it("requests HTML format", () => {
    const prompt = buildContentPrompt({
      title: "Test",
      contentType: "BLOG_POST",
      includeCta: true,
    })
    expect(prompt).toContain("HTML")
  })
})

describe("buildTopicSuggestionPrompt", () => {
  it("includes business name and count", () => {
    const prompt = buildTopicSuggestionPrompt({
      count: 5,
      businessName: "Acme Plumbing",
      existingWebsiteTopics: [],
      existingTableTopics: [],
    })
    expect(prompt).toContain("5")
    expect(prompt).toContain("Acme Plumbing")
    expect(prompt).toContain("JSON")
  })

  it("includes company type when provided", () => {
    const prompt = buildTopicSuggestionPrompt({
      count: 3,
      businessName: "Test Co",
      companyType: "HVAC Contractor",
      existingWebsiteTopics: [],
      existingTableTopics: [],
    })
    expect(prompt).toContain("HVAC Contractor")
  })

  it("includes location when provided", () => {
    const prompt = buildTopicSuggestionPrompt({
      count: 3,
      businessName: "Test Co",
      city: "Austin",
      state: "TX",
      existingWebsiteTopics: [],
      existingTableTopics: [],
    })
    expect(prompt).toContain("Austin")
    expect(prompt).toContain("TX")
  })

  it("lists existing topics to avoid", () => {
    const prompt = buildTopicSuggestionPrompt({
      count: 3,
      businessName: "Test Co",
      existingWebsiteTopics: ["How to Fix a Leaky Faucet"],
      existingTableTopics: ["Best Plumbing Tips 2024"],
    })
    expect(prompt).toContain("How to Fix a Leaky Faucet")
    expect(prompt).toContain("Best Plumbing Tips 2024")
    expect(prompt).toContain("Do NOT suggest topics")
  })

  it("omits dedup section when no existing topics", () => {
    const prompt = buildTopicSuggestionPrompt({
      count: 3,
      businessName: "Test Co",
      existingWebsiteTopics: [],
      existingTableTopics: [],
    })
    expect(prompt).not.toContain("Do NOT suggest topics")
  })
})
