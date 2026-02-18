import { Badge } from "@/components/ui/badge";

const rankStyles: Record<number, string> = {
  1: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  2: "bg-slate-300/20 text-slate-300 border-slate-300/30",
  3: "bg-orange-700/20 text-orange-400 border-orange-700/30",
};

export function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <Badge variant="outline" className={`font-bold ${rankStyles[rank]}`}>
        #{rank}
      </Badge>
    );
  }

  return (
    <span className="text-sm text-muted-foreground font-medium">#{rank}</span>
  );
}
