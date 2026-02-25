"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendChallengeNotification } from "@/lib/notifications";

export async function createChallenge(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();

  const challengerId = formData.get("challenger_id") as string;
  const challengedId = formData.get("challenged_id") as string;
  const message = (formData.get("message") as string) || null;

  const { error } = await supabase.from("challenges").insert({
    challenger_id: challengerId,
    challenged_id: challengedId,
    message,
  });

  if (error) {
    return { error: error.message };
  }

  // Fire-and-forget: notify Teams channel about the new challenge
  const [challengerProfile, challengedProfile] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, elo_rating")
      .eq("id", challengerId)
      .single(),
    supabase
      .from("profiles")
      .select("display_name, username, elo_rating")
      .eq("id", challengedId)
      .single(),
  ]);

  if (challengerProfile.data && challengedProfile.data) {
    sendChallengeNotification({
      challengerName:
        challengerProfile.data.display_name ||
        challengerProfile.data.username,
      challengedName:
        challengedProfile.data.display_name ||
        challengedProfile.data.username,
      challengerElo: challengerProfile.data.elo_rating,
      challengedElo: challengedProfile.data.elo_rating,
      message,
    });
  }

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/dashboard");
  return {};
}

export async function respondToChallenge(formData: FormData) {
  const supabase = await createClient();

  const challengeId = formData.get("challenge_id") as string;
  const response = formData.get("response") as "accepted" | "declined";

  const updateData: Record<string, string> = {
    status: response,
    responded_at: new Date().toISOString(),
  };

  // When accepting, set 48h expiration timer
  if (response === "accepted") {
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    updateData.expires_at = expiresAt.toISOString();
  }

  const { error } = await supabase
    .from("challenges")
    .update(updateData)
    .eq("id", challengeId);

  if (error) {
    redirect(`/challenges?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/dashboard");
}

export async function cancelChallenge(formData: FormData) {
  const supabase = await createClient();

  const challengeId = formData.get("challenge_id") as string;

  const { error } = await supabase
    .from("challenges")
    .update({
      status: "cancelled",
    })
    .eq("id", challengeId);

  if (error) {
    redirect(`/challenges?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/dashboard");
}

export async function resolveChallenge(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const challengeId = formData.get("challenge_id") as string;
  const result = formData.get("result") as "won" | "lost";

  const { error } = await supabase.rpc("resolve_challenge", {
    p_challenge_id: challengeId,
    p_reporter_id: user.id,
    p_reporter_won: result === "won",
  });

  if (error) {
    redirect(`/challenges?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/dashboard");
}
