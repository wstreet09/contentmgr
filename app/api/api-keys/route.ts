import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/crypto"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { encryptedApiKeys: true },
  })

  if (!user?.encryptedApiKeys) {
    return NextResponse.json({ keys: {} })
  }

  try {
    const decrypted = decrypt(user.encryptedApiKeys)
    const keys = JSON.parse(decrypted)

    // Return masked keys (last 4 chars only)
    const maskedKeys: Record<string, string> = {}
    for (const [provider, key] of Object.entries(keys)) {
      if (typeof key === "string" && key.length > 0) {
        maskedKeys[provider] = key.slice(-4)
      }
    }

    return NextResponse.json({ keys: maskedKeys })
  } catch {
    return NextResponse.json({ keys: {} })
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { keys } = await req.json()

  // Get existing keys to merge (only update non-empty values)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { encryptedApiKeys: true },
  })

  let existingKeys: Record<string, string> = {}
  if (user?.encryptedApiKeys) {
    try {
      existingKeys = JSON.parse(decrypt(user.encryptedApiKeys))
    } catch {
      existingKeys = {}
    }
  }

  // Merge: only overwrite if new value is non-empty
  const mergedKeys = { ...existingKeys }
  for (const [provider, key] of Object.entries(keys)) {
    if (typeof key === "string" && key.length > 0) {
      mergedKeys[provider] = key
    }
  }

  const encrypted = encrypt(JSON.stringify(mergedKeys))

  await prisma.user.update({
    where: { id: session.user.id },
    data: { encryptedApiKeys: encrypted },
  })

  // Return masked keys
  const maskedKeys: Record<string, string> = {}
  for (const [provider, key] of Object.entries(mergedKeys)) {
    if (typeof key === "string" && key.length > 0) {
      maskedKeys[provider] = key.slice(-4)
    }
  }

  return NextResponse.json({ keys: maskedKeys })
}
