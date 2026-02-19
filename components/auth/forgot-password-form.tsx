"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormAction } from "@/lib/loading-context";
import { CircleCheck } from "lucide-react";

interface ForgotPasswordFormProps {
  action: (formData: FormData) => Promise<void>;
  error?: string;
  success?: boolean;
}

export function ForgotPasswordForm({
  action,
  error,
  success,
}: ForgotPasswordFormProps) {
  const handleSubmit = useFormAction(action);

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CircleCheck className="size-10 text-green-400" />
        <p className="text-sm text-muted-foreground">
          Check your email for a password reset link. It may take a minute to
          arrive.
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
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
      <Button type="submit" className="w-full">
        Send Reset Link
      </Button>
    </form>
  );
}
