import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { RecordMatchTrigger } from "@/components/matches/record-match-trigger";
import { CreateChallengeTrigger } from "@/components/challenges/create-challenge-trigger";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="inline-flex items-baseline gap-2 text-lg font-bold tracking-tight text-primary"
            >
              <Image src="/ria.svg" alt="RIA" width={32} height={22} />
              <span>ATP Rank</span>
            </Link>
            <div className="hidden items-center gap-4 sm:flex">
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Leaderboard
              </Link>
              <Link
                href="/challenges"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Challenges
              </Link>
              <Link
                href="/tournaments"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Tournaments
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CreateChallengeTrigger variant="outline" />
            <RecordMatchTrigger />
            <form
              action={async () => {
                "use server";
                const supabase = await createClient();
                await supabase.auth.signOut();
                redirect("/login");
              }}
            >
              <Button variant="ghost" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 pb-20 sm:pb-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
