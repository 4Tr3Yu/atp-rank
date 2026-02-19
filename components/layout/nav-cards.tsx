"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Trophy, Swords, Medal, User, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/", label: "Leaderboard", icon: Trophy, description: "View rankings" },
  { href: "/challenges", label: "Challenges", icon: Swords, description: "1v1 battles" },
  { href: "/tournaments", label: "Tournaments", icon: Medal, description: "Compete & win" },
  { href: "/profile", label: "Profile", icon: User, description: "Edit your info" },
];

export function NavCards({ pendingMatchCount = 0 }: { pendingMatchCount?: number }) {
  const pathname = usePathname();
  const hasPending = pendingMatchCount > 0;

  return (
    <div className="hidden sm:grid sm:grid-cols-5 gap-3">
      {/* Confirm Matches - always first */}
      <Link
        href="/matches/pending"
        className={cn(
          "group flex items-center gap-3 rounded-xl border p-4 transition-all hover:border-primary/50 hover:bg-primary/5",
          pathname === "/matches/pending"
            ? "border-primary/50 bg-primary/10"
            : hasPending
              ? "border-primary bg-primary/10 animate-pulse"
              : "border-border bg-card"
        )}
      >
        <ClipboardCheck
          className={cn(
            "h-6 w-6 transition-colors",
            pathname === "/matches/pending" || hasPending
              ? "text-primary"
              : "text-muted-foreground group-hover:text-primary"
          )}
        />
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-sm font-medium",
                pathname === "/matches/pending" || hasPending
                  ? "text-primary"
                  : "text-foreground"
              )}
            >
              Confirm
            </span>
            {hasPending && (
              <Badge className="h-5 px-1.5 text-[10px]">
                {pendingMatchCount}
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">Pending results</span>
        </div>
      </Link>

      {/* Other nav items */}
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
