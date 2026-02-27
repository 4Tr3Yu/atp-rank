"use client";

import Image from "next/image";
import { zenDots } from "@/lib/fonts";
import type { SeasonBannerProps } from "../index";

function getTimeRemaining(endsAt: string): string {
  const now = new Date();
  const end = new Date(endsAt);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "Ending soon";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}

export default function S00OriginsBanner({ season }: SeasonBannerProps) {
  const timeRemaining = getTimeRemaining(season.ends_at);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-950/50 via-background to-background border border-orange-500/20">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl" />
        {/* Diamond watermark */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 h-24 w-24 opacity-[0.07]">
          <Image
            src="/seasons/s00-origins/icon.svg"
            alt=""
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative flex items-center gap-4 px-4 py-3 sm:px-5">
        <Image
          src="/seasons/s00-origins/icon.svg"
          alt="Origins"
          width={28}
          height={32}
          className="h-7 w-auto drop-shadow-[0_0_6px_rgba(251,146,60,0.4)]"
        />
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`text-lg font-bold bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent ${zenDots.className}`}>
            Origins
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Season 0
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">{timeRemaining}</span>
        </div>
      </div>
    </div>
  );
}
