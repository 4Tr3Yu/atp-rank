import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.user_metadata?.display_name || user?.email}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Your stats and quick actions will appear here.
      </div>
    </div>
  );
}
