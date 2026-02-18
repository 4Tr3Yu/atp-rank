import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeaderboardRow } from "./leaderboard-row";
import type { Profile } from "@/lib/types/database";

export function LeaderboardTable({ profiles }: { profiles: Profile[] }) {
  if (profiles.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        No players yet. Sign up to get started!
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Elo</TableHead>
            <TableHead className="text-right">Record</TableHead>
            <TableHead className="text-right">Win %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile, index) => (
            <LeaderboardRow
              key={profile.id}
              profile={profile}
              rank={index + 1}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
