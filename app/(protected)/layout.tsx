import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { zenDots } from "@/lib/fonts";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RecordMatchTrigger } from "@/components/matches/record-match-trigger";
import { CreateChallengeTrigger } from "@/components/challenges/create-challenge-trigger";
import { NavActions } from "@/components/layout/nav-actions";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";


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
          <Link
            href="/dashboard"
            className="inline-flex items-baseline gap-2 text-lg font-bold tracking-tight text-primary"
          >
            <Image src="/ria.svg" alt="RIA" width={32} height={22} />
            <span className={zenDots.className}>ATP Rank</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 relative -top-1">beta</Badge>
          </Link>
          <div className="flex items-center gap-2">
            <NavActions>
              <CreateChallengeTrigger variant="outline" />
              <RecordMatchTrigger />
            </NavActions>
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
      <Footer />
      <MobileNav />
    </div>
  );
}
