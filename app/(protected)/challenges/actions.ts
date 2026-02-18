"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createChallenge(formData: FormData) {
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
    redirect(`/challenges/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/challenges");
  redirect("/challenges");
}

export async function respondToChallenge(formData: FormData) {
  const supabase = await createClient();

  const challengeId = formData.get("challenge_id") as string;
  const response = formData.get("response") as "accepted" | "declined";

  const { error } = await supabase
    .from("challenges")
    .update({
      status: response,
      responded_at: new Date().toISOString(),
    })
    .eq("id", challengeId);

  if (error) {
    redirect(`/challenges?error=${encodeURIComponent(error.message)}`);
  }

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

  revalidatePath("/challenges");
  revalidatePath("/dashboard");
}
