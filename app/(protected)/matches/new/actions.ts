"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function recordMatch(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();

  const matchType = (formData.get("match_type") as string) || "singles";
  const recordedBy = formData.get("recorded_by") as string;
  const challengeId = formData.get("challenge_id") as string | null;
  const tournamentMatchId = formData.get("tournament_match_id") as string | null;

  if (matchType === "doubles") {
    const winner1Id = formData.get("winner1_id") as string;
    const winner2Id = formData.get("winner2_id") as string;
    const loser1Id = formData.get("loser1_id") as string;
    const loser2Id = formData.get("loser2_id") as string;

    // Doubles matches always go through pending confirmation
    const { error } = await supabase.rpc("create_pending_doubles_match", {
      p_winner1_id: winner1Id,
      p_winner2_id: winner2Id,
      p_loser1_id: loser1Id,
      p_loser2_id: loser2Id,
      p_recorded_by: recordedBy,
      p_challenge_id: challengeId || null,
    });

    if (error) {
      return { error: error.message };
    }
  } else {
    const winnerId = formData.get("winner_id") as string;
    const loserId = formData.get("loser_id") as string;

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
  }

  revalidatePath("/", "layout");
  return {};
}
