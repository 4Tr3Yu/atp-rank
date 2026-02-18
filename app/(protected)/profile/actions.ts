"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const username = formData.get("username") as string;
  const displayName = (formData.get("display_name") as string) || null;
  const avatarUrl = (formData.get("avatar_url") as string) || null;

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
