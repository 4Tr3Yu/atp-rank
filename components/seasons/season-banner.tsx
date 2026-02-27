import { Suspense } from "react";
import type { Season } from "@/lib/types/database";
import { getSeasonBanner } from "./season-specifics";
import { Skeleton } from "@/components/ui/skeleton";

function BannerSkeleton() {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-7" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

async function DynamicBanner({ season }: { season: Season }) {
  const BannerComponent = await getSeasonBanner(season.slug);
  if (!BannerComponent) return null;
  return <BannerComponent season={season} />;
}

export async function SeasonBanner({ season }: { season: Season }) {
  if (season.status !== "active") return null;

  return (
    <Suspense fallback={<BannerSkeleton />}>
      <DynamicBanner season={season} />
    </Suspense>
  );
}
