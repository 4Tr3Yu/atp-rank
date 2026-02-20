import { Suspense } from "react";
import type { Season } from "@/lib/types/database";
import { getSeasonHero } from "./season-specifics";
import { Skeleton } from "@/components/ui/skeleton";

interface SeasonHeroProps {
  season: Season;
}

function HeroSkeleton() {
  return (
    <div className="mb-8 rounded-2xl border bg-card p-8">
      <Skeleton className="h-6 w-24 mb-4" />
      <Skeleton className="h-12 w-64 mb-2" />
      <Skeleton className="h-5 w-96" />
    </div>
  );
}

async function DynamicHero({ slug }: { slug: string }) {
  const HeroComponent = await getSeasonHero(slug);

  if (!HeroComponent) {
    // Fallback if no hero component exists for this season
    return null;
  }

  return <HeroComponent />;
}

export async function SeasonHero({ season }: SeasonHeroProps) {
  if (season.status !== "active") {
    return null;
  }

  return (
    <Suspense fallback={<HeroSkeleton />}>
      <DynamicHero slug={season.slug} />
    </Suspense>
  );
}
