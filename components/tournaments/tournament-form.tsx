"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/lib/loading-context";
import { cn } from "@/lib/utils";
import { getPrizes } from "@/lib/tournament-prizes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MatchType } from "@/lib/types/database";

export function TournamentForm({
  currentUserId,
  action,
}: {
  currentUserId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [matchType, setMatchType] = useState<MatchType>("singles");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const handleSubmit = useFormAction(action);
  const prizes = getPrizes(maxPlayers);

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="created_by" value={currentUserId} />
      <input type="hidden" name="match_type" value={matchType} />

      {/* Match Type Toggle */}
      <div className="space-y-2">
        <Label>Format</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMatchType("singles")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-all",
              matchType === "singles"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            1v1 Singles
          </button>
          <button
            type="button"
            onClick={() => setMatchType("doubles")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-all",
              matchType === "doubles"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            2v2 Doubles
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Tournament Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Grand Slam Series #1"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Winner gets bragging rights"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>{matchType === "doubles" ? "Max Teams" : "Max Players"}</Label>
        <Select
          name="max_players"
          defaultValue="8"
          onValueChange={(v) => setMaxPlayers(parseInt(v, 10))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4">4 {matchType === "doubles" ? "teams" : "players"}</SelectItem>
            <SelectItem value="8">8 {matchType === "doubles" ? "teams" : "players"}</SelectItem>
            <SelectItem value="16">16 {matchType === "doubles" ? "teams" : "players"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Prize Preview */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="h-4 w-4 text-primary" />
          Rewards
        </div>
        <div className="flex flex-wrap gap-2">
          {prizes.map((prize) => (
            <div
              key={prize.label}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5"
            >
              <span className="text-xs">{prize.icon}</span>
              <span className="text-xs font-medium">{prize.label}</span>
              <span className="text-xs font-semibold text-green-400">
                +{prize.bonus}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">
        Create Tournament
      </Button>
    </form>
  );
}
