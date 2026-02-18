"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TournamentForm({
  currentUserId,
  action,
}: {
  currentUserId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="created_by" value={currentUserId} />

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
        <Label>Max Players</Label>
        <Select name="max_players" defaultValue="8">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4">4 players</SelectItem>
            <SelectItem value="8">8 players</SelectItem>
            <SelectItem value="16">16 players</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        Create Tournament
      </Button>
    </form>
  );
}
