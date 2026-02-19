import Link from "next/link";
import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 text-sm text-muted-foreground">
        <Github className="size-4" />
        <Link
          href="https://github.com/4Tr3Yu/atp-rank"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          4Tr3Yu/atp-rank
        </Link>
      </div>
    </footer>
  );
}
