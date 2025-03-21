import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Settings | Daily Motivation Dashboard",
  description: "Configure your dashboard settings",
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your dashboard preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/settings">General</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/settings/appearance">Appearance</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/settings/productivity">Productivity</Link>
          </Button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  )
}

