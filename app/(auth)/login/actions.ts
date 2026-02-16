"use server"

import { signIn } from "@/lib/auth"
import { isRedirectError } from "next/dist/client/components/redirect"

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/article",
    })
  } catch (error) {
    // Next.js redirect throws a special error — re-throw it so the redirect works
    if (isRedirectError(error)) {
      throw error
    }
    // Any other error (including AuthError) means login failed
    return { error: "Invalid email or password" }
  }
}
