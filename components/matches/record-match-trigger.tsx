import { createClient } from "@/lib/supabase/server";
import { RecordMatchModal } from "./record-match-modal";
import { recordMatch } from "@/app/(protected)/matches/new/actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export async function RecordMatchTrigger() {
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
    <RecordMatchModal
      players={players || []}
      currentUserId={user.id}
      action={recordMatch}
    >
      <Button size="sm" className="gap-1.5">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Record Match</span>
      </Button>
    </RecordMatchModal>
  );
}
