"use client";

import { Zap } from "lucide-react";

// Season 1: Genesis
// This is a placeholder hero component. Replace with custom design.
// Animations, colors, and layout are fully customizable per season.

export default function S1GenesisHero() {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-950/50 via-background to-background border border-orange-500/20">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-orange-600/10 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative px-6 py-8 sm:px-8 sm:py-12">
        {/* Season badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-3 py-1 text-sm font-medium text-orange-400 animate-fade-in">
          <Zap className="h-4 w-4" />
          <span>Season 1</span>
        </div>

        {/* Main headline */}
        <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl animate-fade-in-up">
          <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent">
            Genesis
          </span>
        </h1>

        {/* Subheadline */}
        <p className="max-w-xl text-lg text-muted-foreground animate-fade-in-up animation-delay-150">
          The first season of ATP Rank has begun. Climb the ranks, challenge
          your friends, and claim your place in history.
        </p>

        {/* Season info */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground animate-fade-in-up animation-delay-300">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Season Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
