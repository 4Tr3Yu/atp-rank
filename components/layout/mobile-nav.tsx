"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Home,
  Swords,
  Medal,
  User,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/", label: "Ranks", icon: Trophy },
  { href: "/challenges", label: "Challenges", icon: Swords },
  { href: "/tournaments", label: "Tourneys", icon: Medal },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:hidden">
      <div className="flex h-14 items-center justify-around px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
