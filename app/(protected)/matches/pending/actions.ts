"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function confirmMatch(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const matchId = formData.get("match_id") as string;

  const { error } = await supabase.rpc("confirm_match", {
    p_match_id: matchId,
    p_confirmer_id: user.id,
  });

  if (error) {
    redirect(
      `/matches/pending?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/", "layout");
  redirect("/matches/pending");
}

export async function declineMatch(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const matchId = formData.get("match_id") as string;

  const { error } = await supabase.rpc("decline_match", {
    p_match_id: matchId,
    p_decliner_id: user.id,
  });

  if (error) {
    redirect(
      `/matches/pending?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/", "layout");
  redirect("/matches/pending");
}
