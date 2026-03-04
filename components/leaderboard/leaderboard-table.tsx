import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeaderboardRow } from "./leaderboard-row";
import type { Profile } from "@/lib/types/database";

export function LeaderboardTable({
  profiles,
  unrankedProfiles = [],
  tierFinishes,
}: {
  profiles: Profile[];
  unrankedProfiles?: Profile[];
  tierFinishes?: Map<string, number>;
}) {
  if (profiles.length === 0 && unrankedProfiles.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        No players yet. Sign up to get started!
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table className="overflow-visible">
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Elo</TableHead>
            <TableHead className="text-right">Record</TableHead>
            <TableHead className="text-right">Win %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="overflow-visible">
          {profiles.map((profile, index) => (
            <LeaderboardRow
              key={profile.id}
              profile={profile}
              rank={index + 1}
              seasonFinishElo={tierFinishes?.get(profile.id)}
            />
          ))}
          {unrankedProfiles.length > 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-xs text-muted-foreground py-2 border-t border-dashed border-border"
              >
                Unranked
              </TableCell>
            </TableRow>
          )}
          {unrankedProfiles.map((profile) => (
            <LeaderboardRow
              key={profile.id}
              profile={profile}
              rank={null}
              seasonFinishElo={tierFinishes?.get(profile.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
