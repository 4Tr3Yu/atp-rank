"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateBracket, seedPlayers, seedTeams, getNextMatch } from "@/lib/tournament";

export async function createTournament(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const maxPlayers = parseInt(formData.get("max_players") as string, 10);
  const createdBy = formData.get("created_by") as string;
  const matchType = (formData.get("match_type") as string) || "singles";

  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      name,
      description,
      max_players: maxPlayers,
      status: "open",
      created_by: createdBy,
      match_type: matchType,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/tournaments?error=${encodeURIComponent(error.message)}`);
  }

  // Auto-join creator (for doubles, creator joins without partner — they need to set partner separately or we skip auto-join for doubles)
  if (matchType === "singles") {
    await supabase.from("tournament_participants").insert({
      tournament_id: data.id,
      player_id: createdBy,
    });
  }

  revalidatePath("/tournaments");
  redirect(`/tournaments/${data.id}`);
}

export async function joinTournament(formData: FormData) {
  const supabase = await createClient();

  const tournamentId = formData.get("tournament_id") as string;
  const playerId = formData.get("player_id") as string;
  const partnerId = formData.get("partner_id") as string | null;

  // Validate partner isn't already in the tournament (for doubles)
  if (partnerId) {
    const { data: existing } = await supabase
      .from("tournament_participants")
      .select("id")
      .eq("tournament_id", tournamentId)
      .or(`player_id.eq.${partnerId},partner_id.eq.${partnerId}`)
      .limit(1);

    if (existing && existing.length > 0) {
      redirect(
        `/tournaments/${tournamentId}?error=${encodeURIComponent("Your partner is already in this tournament")}`
      );
    }
  }

  const { error } = await supabase.from("tournament_participants").insert({
    tournament_id: tournamentId,
    player_id: playerId,
    partner_id: partnerId || null,
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

  // Delete participant row (covers both player_id and partner_id cases)
  await supabase
    .from("tournament_participants")
    .delete()
    .eq("tournament_id", tournamentId)
    .or(`player_id.eq.${playerId},partner_id.eq.${playerId}`);

  revalidatePath(`/tournaments/${tournamentId}`);
}

export async function startTournament(formData: FormData) {
  const supabase = await createClient();

  const tournamentId = formData.get("tournament_id") as string;

  // Fetch tournament to check match_type
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("match_type")
    .eq("id", tournamentId)
    .single();

  const isDoubles = tournament?.match_type === "doubles";

  // Fetch participants with their Elo ratings
  const { data: participants } = await supabase
    .from("tournament_participants")
    .select("player_id, partner_id, profiles(elo_rating)")
    .eq("tournament_id", tournamentId);

  if (!participants || participants.length < 2) {
    redirect(
      `/tournaments/${tournamentId}?error=${encodeURIComponent("Need at least 2 " + (isDoubles ? "teams" : "players"))}`
    );
  }

  let seededIds: string[];
  // Map of team lead ID → partner ID (for doubles bracket insertion)
  const partnerMap = new Map<string, string>();

  if (isDoubles) {
    // Build teams with combined Elo
    const teams: { id: string; partnerId: string; teamElo: number }[] = [];
    for (const p of participants) {
      const playerElo = (p.profiles as unknown as { elo_rating: number })?.elo_rating || 1200;
      // Fetch partner's Elo
      let partnerElo = 1200;
      if (p.partner_id) {
        const { data: partnerProfile } = await supabase
          .from("profiles")
          .select("elo_rating")
          .eq("id", p.partner_id)
          .single();
        partnerElo = partnerProfile?.elo_rating || 1200;
        partnerMap.set(p.player_id, p.partner_id);
      }
      teams.push({
        id: p.player_id,
        partnerId: p.partner_id || "",
        teamElo: playerElo + partnerElo,
      });
    }
    seededIds = seedTeams(teams);
  } else {
    // Singles seeding
    const playersForSeeding = participants.map((p) => ({
      id: p.player_id,
      elo_rating: (p.profiles as unknown as { elo_rating: number })?.elo_rating || 1200,
    }));
    seededIds = seedPlayers(playersForSeeding);
  }

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

  // Insert bracket matches (with partner IDs for doubles)
  const { error: matchError } = await supabase
    .from("tournament_matches")
    .insert(
      bracketMatches.map((m) => ({
        tournament_id: tournamentId,
        round: m.round,
        position: m.position,
        player1_id: m.player1_id,
        player2_id: m.player2_id,
        player1_partner_id: isDoubles && m.player1_id ? partnerMap.get(m.player1_id) || null : null,
        player2_partner_id: isDoubles && m.player2_id ? partnerMap.get(m.player2_id) || null : null,
      }))
    );

  if (matchError) {
    redirect(
      `/tournaments/${tournamentId}?error=${encodeURIComponent(matchError.message)}`
    );
  }

  // Auto-advance byes (matches where one player/team is null)
  const { data: byeMatches } = await supabase
    .from("tournament_matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("round", 1)
    .or("player1_id.is.null,player2_id.is.null");

  for (const byeMatch of byeMatches || []) {
    const winnerId = byeMatch.player1_id || byeMatch.player2_id;
    if (!winnerId) continue;

    const winnerPartnerId = byeMatch.player1_id
      ? byeMatch.player1_partner_id
      : byeMatch.player2_partner_id;

    await supabase
      .from("tournament_matches")
      .update({ winner_id: winnerId, winner_partner_id: winnerPartnerId || null })
      .eq("id", byeMatch.id);

    // Advance winner to next round
    const next = getNextMatch(byeMatch.round, byeMatch.position);
    const advanceData: Record<string, string | null> = { [next.slot]: winnerId };
    if (isDoubles && winnerPartnerId) {
      const partnerSlot = next.slot === "player1_id" ? "player1_partner_id" : "player2_partner_id";
      advanceData[partnerSlot] = winnerPartnerId;
    }

    await supabase
      .from("tournament_matches")
      .update(advanceData)
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

  // Check if this is a doubles tournament
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("match_type")
    .eq("id", tournamentId)
    .single();

  const isDoubles = tournament?.match_type === "doubles";

  if (isDoubles) {
    // Fetch the tournament match to get partner IDs
    const { data: tMatchData } = await supabase
      .from("tournament_matches")
      .select("player1_id, player2_id, player1_partner_id, player2_partner_id, round, position")
      .eq("id", tournamentMatchId)
      .single();

    if (!tMatchData) {
      redirect(`/tournaments/${tournamentId}?error=Match not found`);
    }

    // Determine winner/loser partner IDs
    const isWinnerPlayer1 = winnerId === tMatchData.player1_id;
    const winnerPartnerId = isWinnerPlayer1 ? tMatchData.player1_partner_id : tMatchData.player2_partner_id;
    const loserPartnerId = isWinnerPlayer1 ? tMatchData.player2_partner_id : tMatchData.player1_partner_id;

    // Record doubles match via RPC
    const { error } = await supabase.rpc("record_doubles_match", {
      p_winner1_id: winnerId,
      p_winner2_id: winnerPartnerId!,
      p_loser1_id: loserId,
      p_loser2_id: loserPartnerId!,
      p_recorded_by: recordedBy,
    });

    if (error) {
      redirect(`/tournaments/${tournamentId}?error=${encodeURIComponent(error.message)}`);
    }

    // Set winner and winner_partner on the tournament match
    await supabase
      .from("tournament_matches")
      .update({ winner_id: winnerId, winner_partner_id: winnerPartnerId })
      .eq("id", tournamentMatchId);

    // Mark losing team as eliminated (both player and partner)
    await supabase
      .from("tournament_participants")
      .update({ eliminated: true })
      .eq("tournament_id", tournamentId)
      .eq("player_id", loserId);

    // Check advancement
    const { data: allMatches } = await supabase
      .from("tournament_matches")
      .select("round")
      .eq("tournament_id", tournamentId)
      .order("round", { ascending: false })
      .limit(1);

    const maxRound = allMatches?.[0]?.round || 1;

    if (tMatchData.round < maxRound) {
      const next = getNextMatch(tMatchData.round, tMatchData.position);
      const partnerSlot = next.slot === "player1_id" ? "player1_partner_id" : "player2_partner_id";
      await supabase
        .from("tournament_matches")
        .update({
          [next.slot]: winnerId,
          [partnerSlot]: winnerPartnerId,
        })
        .eq("tournament_id", tournamentId)
        .eq("round", next.round)
        .eq("position", next.position);
    } else {
      // Final — complete tournament
      await supabase
        .from("tournaments")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", tournamentId);

      // Award Elo bonuses based on tournament placement
      await supabase.rpc("award_tournament_points", {
        p_tournament_id: tournamentId,
      });
    }
  } else {
    // Singles match recording (existing logic)
    const { error } = await supabase.rpc("record_match", {
      p_winner_id: winnerId,
      p_loser_id: loserId,
      p_recorded_by: recordedBy,
      p_tournament_match_id: tournamentMatchId,
    });

    if (error) {
      redirect(`/tournaments/${tournamentId}?error=${encodeURIComponent(error.message)}`);
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
      const { data: allMatches } = await supabase
        .from("tournament_matches")
        .select("round")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: false })
        .limit(1);

      const maxRound = allMatches?.[0]?.round || 1;

      if (tMatch.round < maxRound) {
        const next = getNextMatch(tMatch.round, tMatch.position);
        await supabase
          .from("tournament_matches")
          .update({ [next.slot]: winnerId })
          .eq("tournament_id", tournamentId)
          .eq("round", next.round)
          .eq("position", next.position);
      } else {
        await supabase
          .from("tournaments")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", tournamentId);
      }
    }
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/", "layout");
}
