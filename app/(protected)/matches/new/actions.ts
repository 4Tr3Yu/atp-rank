"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function recordMatch(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();

  const winnerId = formData.get("winner_id") as string;
  const loserId = formData.get("loser_id") as string;
  const recordedBy = formData.get("recorded_by") as string;
  const challengeId = formData.get("challenge_id") as string | null;
  const tournamentMatchId = formData.get("tournament_match_id") as string | null;

  // Tournament matches don't require confirmation - use direct record
  if (tournamentMatchId) {
    const { error } = await supabase.rpc("record_match", {
      p_winner_id: winnerId,
      p_loser_id: loserId,
      p_recorded_by: recordedBy,
      p_challenge_id: null,
      p_tournament_match_id: tournamentMatchId,
    });

    if (error) {
      return { error: error.message };
    }
  } else {
    // Regular matches require opponent confirmation
    const { error } = await supabase.rpc("create_pending_match", {
      p_winner_id: winnerId,
      p_loser_id: loserId,
      p_recorded_by: recordedBy,
      p_challenge_id: challengeId || null,
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/", "layout");
  return {};
}
