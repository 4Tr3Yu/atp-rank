import { createClient } from "@/lib/supabase/server";
import { CreateChallengeForm } from "@/components/challenges/create-challenge-form";
import { createChallenge } from "../actions";

export default async function NewChallengePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: players } = await supabase
    .from("profiles")
    .select("*")
    .order("elo_rating", { ascending: false });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Challenge</h1>
        <p className="text-muted-foreground">
          Challenge a friend to a match
        </p>
      </div>
      <CreateChallengeForm
        players={players || []}
        currentUserId={user!.id}
        action={createChallenge}
      />
    </div>
  );
}
