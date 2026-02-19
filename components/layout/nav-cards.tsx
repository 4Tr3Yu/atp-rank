"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Trophy, Swords, Medal, User } from "lucide-react";

const navItems = [
  { href: "/", label: "Leaderboard", icon: Trophy, description: "View rankings" },
  { href: "/challenges", label: "Challenges", icon: Swords, description: "1v1 battles" },
  { href: "/tournaments", label: "Tournaments", icon: Medal, description: "Compete & win" },
  { href: "/profile", label: "Profile", icon: User, description: "Edit your info" },
];

export function NavCards() {
  const pathname = usePathname();

  return (
    <div className="hidden sm:grid sm:grid-cols-4 gap-3">
      {navItems.map(({ href, label, icon: Icon, description }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-xl border p-4 transition-all hover:border-primary/50 hover:bg-primary/5",
              isActive
                ? "border-primary/50 bg-primary/10"
                : "border-border bg-card"
            )}
          >
            <Icon
              className={cn(
                "h-6 w-6 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )}
            />
            <div className="flex flex-col items-start">
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-primary" : "text-foreground"
                )}
              >
                {label}
              </span>
              <span className="text-[10px] text-muted-foreground">{description}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
