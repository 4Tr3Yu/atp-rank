"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <h1 className="text-4xl font-bold text-destructive">Something broke</h1>
      <p className="text-muted-foreground">
        An unexpected error occurred. Try again.
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
