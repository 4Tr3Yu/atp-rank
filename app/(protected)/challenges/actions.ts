"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createChallenge(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();

  const challengerId = formData.get("challenger_id") as string;
  const challengedId = formData.get("challenged_id") as string;
  const message = (formData.get("message") as string) || null;
  const matchType = (formData.get("match_type") as string) || "singles";
  const challengerPartnerId = formData.get("challenger_partner_id") as string | null;
  const challengedPartnerId = formData.get("challenged_partner_id") as string | null;

  const { error } = await supabase.from("challenges").insert({
    challenger_id: challengerId,
    challenged_id: challengedId,
    message,
    match_type: matchType,
    challenger_partner_id: matchType === "doubles" ? challengerPartnerId : null,
    challenged_partner_id: matchType === "doubles" ? challengedPartnerId : null,
  });

  if (error) {
    return { error: error.message };
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

  // Fetch challenge to check match_type
  const { data: challenge } = await supabase
    .from("challenges")
    .select("match_type")
    .eq("id", challengeId)
    .single();

  if (challenge?.match_type === "doubles") {
    const { error } = await supabase.rpc("resolve_doubles_challenge", {
      p_challenge_id: challengeId,
      p_reporter_id: user.id,
      p_reporter_won: result === "won",
    });

    if (error) {
      redirect(`/challenges?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    const { error } = await supabase.rpc("resolve_challenge", {
      p_challenge_id: challengeId,
      p_reporter_id: user.id,
      p_reporter_won: result === "won",
    });

    if (error) {
      redirect(`/challenges?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/");
  revalidatePath("/challenges");
  revalidatePath("/dashboard");
}
