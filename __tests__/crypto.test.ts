import { describe, it, expect, beforeAll } from "vitest"
import { encrypt, decrypt } from "@/lib/crypto"

beforeAll(() => {
  // Set a test encryption key (32 bytes hex = 64 chars)
  process.env.ENCRYPTION_KEY = "a".repeat(64)
})

describe("crypto", () => {
  it("encrypts and decrypts a string roundtrip", () => {
    const plaintext = "sk-test-key-12345"
    const encrypted = encrypt(plaintext)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it("produces different ciphertext for same plaintext (random IV)", () => {
    const plaintext = "same-input"
    const a = encrypt(plaintext)
    const b = encrypt(plaintext)
    expect(a).not.toBe(b)
  })

  it("encrypted format is iv:authTag:ciphertext", () => {
    const encrypted = encrypt("test")
    const parts = encrypted.split(":")
    expect(parts).toHaveLength(3)
    // IV is 16 bytes = 32 hex chars
    expect(parts[0]).toHaveLength(32)
  })

  it("handles empty string", () => {
    const encrypted = encrypt("")
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe("")
  })

  it("handles JSON objects", () => {
    const obj = { openai: "sk-123", anthropic: "sk-456" }
    const encrypted = encrypt(JSON.stringify(obj))
    const decrypted = JSON.parse(decrypt(encrypted))
    expect(decrypted).toEqual(obj)
  })
})
