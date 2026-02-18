import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-lg text-muted-foreground">
        This page went out of bounds
      </p>
      <Button asChild>
        <Link href="/">Back to Leaderboard</Link>
      </Button>
    </div>
  );
}
