import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-primary"
            >
              RIA ATP Rank
            </Link>
            <div className="hidden items-center gap-4 sm:flex">
              <Link
                href="/"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Leaderboard
              </Link>
              <Link
                href="/matches"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Matches
              </Link>
            </div>
          </div>
          <div>
            {user ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
