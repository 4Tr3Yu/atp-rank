"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/lib/loading-context";
import { cn } from "@/lib/utils";
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
  const handleSubmit = useFormAction(action);

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
        <Select name="max_players" defaultValue="8">
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

      <Button type="submit" className="w-full">
        Create Tournament
      </Button>
    </form>
  );
}
