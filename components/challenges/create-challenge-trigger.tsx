import { createClient } from "@/lib/supabase/server";
import { CreateChallengeModal } from "./create-challenge-modal";
import { createChallenge } from "@/app/(protected)/challenges/actions";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";

export async function CreateChallengeTrigger({
  variant = "outline",
  showLabel = true,
}: {
  variant?: "default" | "outline" | "ghost";
  showLabel?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: players } = await supabase
    .from("profiles")
    .select("*")
    .order("elo_rating", { ascending: false });

  return (
    <CreateChallengeModal
      players={players || []}
      currentUserId={user.id}
      action={createChallenge}
    >
      <Button size="sm" variant={variant} className="gap-1.5">
        <Swords className="h-4 w-4" />
        {showLabel && <span className="hidden sm:inline">Challenge</span>}
      </Button>
    </CreateChallengeModal>
  );
}
