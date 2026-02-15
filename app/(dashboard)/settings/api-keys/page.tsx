import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ApiKeyForm } from "@/components/settings/api-key-form"

export default async function ApiKeysPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-muted-foreground">
          Manage your LLM provider API keys. Keys are encrypted at rest.
        </p>
      </div>
      <ApiKeyForm />
    </div>
  )
}
