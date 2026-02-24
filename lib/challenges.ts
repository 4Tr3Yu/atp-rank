import { createClient } from "@/lib/supabase/server";

export async function resolveExpiredChallenges() {
  const supabase = await createClient();
  await supabase.rpc("resolve_expired_challenges");
}
