"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTier } from "@/lib/tiers";
import { TierGem } from "@/components/shared/tier-gem";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Profile } from "@/lib/types/database";

export function PlayerSelect({
  players,
  value,
  onSelect,
  placeholder = "Select player...",
  excludeId,
}: {
  players: Profile[];
  value: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  excludeId?: string;
}) {
  const [open, setOpen] = useState(false);
  const filtered = excludeId
    ? players.filter((p) => p.id !== excludeId)
    : players;
  const selected = players.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected
            ? `${selected.display_name || selected.username} (${selected.elo_rating})`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search players..." />
          <CommandList>
            <CommandEmpty>No player found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((player) => (
                <CommandItem
                  key={player.id}
                  value={`${player.display_name || ""} ${player.username}`}
                  onSelect={() => {
                    onSelect(player.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === player.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-medium">
                    {player.display_name || player.username}
                  </span>
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                    <TierGem tier={getTier(player.elo_rating)} size={12} />
                    {player.elo_rating}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
