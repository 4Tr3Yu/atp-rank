"use client";

import type { Match } from "@/lib/types/database";

export function EloChart({
  matches,
  playerId,
}: {
  matches: Match[];
  playerId: string;
}) {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        No match history to chart yet.
      </div>
    );
  }

  // Build Elo history from oldest to newest
  const sortedMatches = [...matches].reverse();
  const points: { elo: number; label: string }[] = [{ elo: 1200, label: "Start" }];

  for (const match of sortedMatches) {
    const won = match.winner_id === playerId;
    const elo = won
      ? match.winner_elo_before + match.elo_change
      : Math.max(100, match.loser_elo_before - match.elo_change);
    const date = new Date(match.played_at);
    points.push({
      elo,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
    });
  }

  // Simple SVG line chart
  const width = 600;
  const height = 200;
  const padding = 40;

  const elos = points.map((p) => p.elo);
  const minElo = Math.min(...elos) - 20;
  const maxElo = Math.max(...elos) + 20;
  const range = maxElo - minElo || 1;

  const xScale = (i: number) =>
    padding + (i / (points.length - 1)) * (width - padding * 2);
  const yScale = (elo: number) =>
    height - padding - ((elo - minElo) / range) * (height - padding * 2);

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(p.elo)}`)
    .join(" ");

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-sm font-medium text-muted-foreground">
        Elo Rating Over Time
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const elo = Math.round(minElo + range * pct);
          const y = yScale(elo);
          return (
            <g key={pct}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.1}
              />
              <text
                x={padding - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize={10}
              >
                {elo}
              </text>
            </g>
          );
        })}

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="oklch(0.705 0.191 47.604)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(p.elo)}
            r={3}
            fill="oklch(0.705 0.191 47.604)"
          />
        ))}
      </svg>
    </div>
  );
}
