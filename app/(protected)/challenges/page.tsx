import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChallengeList } from "@/components/challenges/challenge-list";
import { CreateChallengeTrigger } from "@/components/challenges/create-challenge-trigger";
import { respondToChallenge, cancelChallenge } from "./actions";
import type { Profile } from "@/lib/types/database";

export default async function ChallengesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  // Fetch all user's challenges
  const { data: challenges } = await supabase
    .from("challenges")
    .select("*")
    .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  // Profile map
  const { data: profiles } = await supabase.from("profiles").select("*");
  const profileMap = new Map<string, Profile>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  const all = challenges || [];
  const received = all.filter(
    (c) => c.challenged_id === userId && c.status === "pending"
  );
  const sent = all.filter(
    (c) => c.challenger_id === userId && (c.status === "pending" || c.status === "accepted")
  );
  const active = all.filter((c) => c.status === "accepted");
  const history = all.filter(
    (c) => c.status === "completed" || c.status === "declined" || c.status === "cancelled"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Challenges</h1>
          <p className="text-muted-foreground">
            Challenge friends to a match
          </p>
        </div>
        <CreateChallengeTrigger variant="default" showLabel />
      </div>

      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">
            Received{received.length > 0 ? ` (${received.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent{sent.length > 0 ? ` (${sent.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active{active.length > 0 ? ` (${active.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-4">
          <ChallengeList
            challenges={received}
            profiles={profileMap}
            currentUserId={userId}
            respondAction={respondToChallenge}
            cancelAction={cancelChallenge}
          />
        </TabsContent>

        <TabsContent value="sent" className="mt-4">
          <ChallengeList
            challenges={sent}
            profiles={profileMap}
            currentUserId={userId}
            respondAction={respondToChallenge}
            cancelAction={cancelChallenge}
          />
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          <ChallengeList
            challenges={active}
            profiles={profileMap}
            currentUserId={userId}
            respondAction={respondToChallenge}
            cancelAction={cancelChallenge}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <ChallengeList
            challenges={history}
            profiles={profileMap}
            currentUserId={userId}
            respondAction={respondToChallenge}
            cancelAction={cancelChallenge}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
