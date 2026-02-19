"use client"

import { useFormAction } from "@/lib/loading-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface SignupFormProps {
  action: (formData: FormData) => Promise<void>
  error?: string
}

export function SignupForm({ action, error }: SignupFormProps) {
  const handleSubmit = useFormAction(action)

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          placeholder="mario_ace"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={6}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Sign Up
      </Button>
    </form>
  )
}
