"use server"

import { signIn } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AuthError } from "next-auth"

export async function adminLoginAction(formData: FormData) {
  const email = formData.get("email") as string

  // Pre-check: reject non-admins before attempting auth
  const user = await prisma.user.findUnique({
    where: { email },
    select: { isSuperAdmin: true },
  })

  if (!user?.isSuperAdmin) {
    return { error: "Invalid credentials" }
  }

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password") as string,
      redirectTo: "/admin",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid credentials" }
    }
    throw error
  }
}
