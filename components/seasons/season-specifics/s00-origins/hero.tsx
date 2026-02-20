"use client";

// Season 0: Origins
// Customize this hero with your own design, colors, and animations.

export default function S00OriginsHero() {
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
          <span>Season 0</span>
        </div>

        {/* Main headline */}
        <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl animate-fade-in-up">
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
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
    </div>
  );
}
