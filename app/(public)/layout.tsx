import Image from "next/image";
import Link from "next/link";
import { zenDots } from "@/lib/fonts";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/layout/footer";


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
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="inline-flex items-baseline gap-2 text-lg font-bold tracking-tight text-primary"
            >
              <Image src="/ria.svg" alt="RIA" width={32} height={22} />
              <span className={zenDots.className}>ATP Rank</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 relative -top-1">beta</Badge>
            </Link>
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
      <main className="mx-auto max-w-5xl px-4 py-8 pb-16">{children}</main>
      <Footer />
    </div>
  );
}
