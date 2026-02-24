"use client";

import Image from "next/image";
import { zenDots } from "@/lib/fonts";

// Season 0: Origins
// Customize this hero with your own design, colors, and animations.

const medals = [
  { src: "/seasons/s00-origins/medal-gold.svg", alt: "Gold Medal", z: "z-40" },
  { src: "/seasons/s00-origins/medal-silver.svg", alt: "Silver Medal", z: "z-30" },
  { src: "/seasons/s00-origins/medal-bronze.svg", alt: "Bronze Medal", z: "z-20" },
  { src: "/seasons/s00-origins/medal-mvp.svg", alt: "MVP Medal", z: "z-10" },
];

export default function S00OriginsHero() {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-950/50 via-background to-background border border-orange-500/20">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-orange-600/10 blur-3xl" />
        {/* Large diamond watermark */}
        <div className="absolute left-32 top-1/2 -translate-y-1/2 h-80 w-80 opacity-[0.07]">
          <Image
            src="/seasons/s00-origins/icon.svg"
            alt=""
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative flex items-center justify-between px-6 py-8 sm:px-8 sm:py-12">
        <div>
          {/* Season badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-3 py-1 text-sm font-medium text-orange-400 animate-fade-in">
            <span>Season 0</span>
          </div>

          {/* Main headline */}
          <h1 className={`mb-2 flex items-center gap-3 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl animate-fade-in-up ${zenDots.className}`}>
            <Image
              src="/seasons/s00-origins/icon.svg"
              alt="Origins"
              width={48}
              height={56}
              className="h-10 w-auto sm:h-12 md:h-14 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]"
            />
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent leading-relaxed pb-1">
              Origins
            </span>
          </h1>

          {/* Subheadline */}
          <p className="max-w-xl text-lg text-muted-foreground animate-fade-in-up animation-delay-150">
            Where legends begin. The inaugural season of ATP Rank.
          </p>

          {/* Season info */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground animate-fade-in-up animation-delay-300">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Season Active</span>
            </div>
          </div>
        </div>

        {/* Medals showcase — overlapping row, gold on top closest to text */}
        <div className="hidden sm:flex items-center shrink-0 animate-fade-in-up animation-delay-150">
          {medals.map((medal, i) => (
            <div
              key={medal.alt}
              className={`relative h-36 w-36 md:h-48 md:w-48 transition-transform hover:scale-110 ${medal.z}`}
              style={{ marginLeft: i === 0 ? 0 : "-7rem" }}
            >
              <Image
                src={medal.src}
                alt={medal.alt}
                fill
                className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] drop-shadow-[0_0_16px_rgba(251,146,60,0.3)]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
