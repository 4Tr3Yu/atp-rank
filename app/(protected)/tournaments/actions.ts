"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateBracket, seedPlayers, getNextMatch } from "@/lib/tournament";

export async function createTournament(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const maxPlayers = parseInt(formData.get("max_players") as string, 10);
  const createdBy = formData.get("created_by") as string;

  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      name,
      description,
      max_players: maxPlayers,
      status: "open",
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/tournaments?error=${encodeURIComponent(error.message)}`);
  }

  // Auto-join creator
  await supabase.from("tournament_participants").insert({
    tournament_id: data.id,
    player_id: createdBy,
  });

  revalidatePath("/tournaments");
  redirect(`/tournaments/${data.id}`);
}

export async function joinTournament(formData: FormData) {
  const supabase = await createClient();

  const tournamentId = formData.get("tournament_id") as string;
  const playerId = formData.get("player_id") as string;

  const { error } = await supabase.from("tournament_participants").insert({
    tournament_id: tournamentId,
    player_id: playerId,
  });

  if (error) {
    redirect(
      `/tournaments/${tournamentId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/tournaments/${tournamentId}`);
}

export async function leaveTournament(formData: FormData) {
  const supabase = await createClient();

  const tournamentId = formData.get("tournament_id") as string;
  const playerId = formData.get("player_id") as string;

  await supabase
    .from("tournament_participants")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("player_id", playerId);

  revalidatePath(`/tournaments/${tournamentId}`);
}

export async function startTournament(formData: FormData) {
  const supabase = await createClient();

  const tournamentId = formData.get("tournament_id") as string;

  // Fetch participants with their Elo ratings
  const { data: participants } = await supabase
    .from("tournament_participants")
    .select("player_id, profiles(elo_rating)")
    .eq("tournament_id", tournamentId);

  if (!participants || participants.length < 2) {
    redirect(
      `/tournaments/${tournamentId}?error=${encodeURIComponent("Need at least 2 players")}`
    );
  }

  // Seed players by Elo
  const playersForSeeding = participants.map((p) => ({
    id: p.player_id,
    elo_rating: (p.profiles as unknown as { elo_rating: number })?.elo_rating || 1200,
  }));

  const seededIds = seedPlayers(playersForSeeding);

  // Update seed numbers
  for (let i = 0; i < seededIds.length; i++) {
    await supabase
      .from("tournament_participants")
      .update({ seed: i + 1 })
      .eq("tournament_id", tournamentId)
      .eq("player_id", seededIds[i]);
  }

  // Generate bracket
  const bracketMatches = generateBracket(seededIds);

  // Insert bracket matches
  const { error: matchError } = await supabase
    .from("tournament_matches")
    .insert(
      bracketMatches.map((m) => ({
        tournament_id: tournamentId,
        round: m.round,
        position: m.position,
        player1_id: m.player1_id,
        player2_id: m.player2_id,
      }))
    );

  if (matchError) {
    redirect(
      `/tournaments/${tournamentId}?error=${encodeURIComponent(matchError.message)}`
    );
  }

  // Auto-advance byes (matches where one player is null)
  const { data: byeMatches } = await supabase
    .from("tournament_matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("round", 1)
    .or("player1_id.is.null,player2_id.is.null");

  for (const byeMatch of byeMatches || []) {
    const winnerId = byeMatch.player1_id || byeMatch.player2_id;
    if (!winnerId) continue;

    await supabase
      .from("tournament_matches")
      .update({ winner_id: winnerId })
      .eq("id", byeMatch.id);

    // Advance winner to next round
    const next = getNextMatch(byeMatch.round, byeMatch.position);
    await supabase
      .from("tournament_matches")
      .update({ [next.slot]: winnerId })
      .eq("tournament_id", tournamentId)
      .eq("round", next.round)
      .eq("position", next.position);
  }

  // Update tournament status
  await supabase
    .from("tournaments")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", tournamentId);

  revalidatePath(`/tournaments/${tournamentId}`);
}

export async function recordTournamentMatch(formData: FormData) {
  const supabase = await createClient();

  const tournamentId = formData.get("tournament_id") as string;
  const tournamentMatchId = formData.get("tournament_match_id") as string;
  const winnerId = formData.get("winner_id") as string;
  const loserId = formData.get("loser_id") as string;
  const recordedBy = formData.get("recorded_by") as string;

  // Record the match via RPC (updates Elo)
  const { error } = await supabase.rpc("record_match", {
    p_winner_id: winnerId,
    p_loser_id: loserId,
    p_recorded_by: recordedBy,
    p_tournament_match_id: tournamentMatchId,
  });

  if (error) {
    redirect(
      `/tournaments/${tournamentId}?error=${encodeURIComponent(error.message)}`
    );
  }

  // Mark loser as eliminated
  await supabase
    .from("tournament_participants")
    .update({ eliminated: true })
    .eq("tournament_id", tournamentId)
    .eq("player_id", loserId);

  // Get tournament match details to advance winner
  const { data: tMatch } = await supabase
    .from("tournament_matches")
    .select("round, position")
    .eq("id", tournamentMatchId)
    .single();

  if (tMatch) {
    // Check if there's a next round
    const { data: allMatches } = await supabase
      .from("tournament_matches")
      .select("round")
      .eq("tournament_id", tournamentId)
      .order("round", { ascending: false })
      .limit(1);

    const maxRound = allMatches?.[0]?.round || 1;

    if (tMatch.round < maxRound) {
      // Advance winner to next round
      const next = getNextMatch(tMatch.round, tMatch.position);
      await supabase
        .from("tournament_matches")
        .update({ [next.slot]: winnerId })
        .eq("tournament_id", tournamentId)
        .eq("round", next.round)
        .eq("position", next.position);
    } else {
      // This was the final — tournament is completed
      await supabase
        .from("tournaments")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", tournamentId);
    }
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/", "layout");
}
