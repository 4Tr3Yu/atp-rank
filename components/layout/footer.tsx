import Link from "next/link";
import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-6">
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
