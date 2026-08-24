import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell, BrandHeader, PoweredByTapp } from "@/components/journey/AppShell";
import { BackButton } from "@/components/journey/BackButton";
import { BigButton, BigLink } from "@/components/journey/BigButton";
import { supabase } from "@/integrations/supabase/client";
import { useJourney } from "@/lib/journey/store";
import {
  prefetchJourneyAssets,
  readJourneyCache,
  writeJourneyCache,
} from "@/lib/journey/journey-cache";
import { createVisitor, loadVisitor, type VisitorSession } from "@/lib/journey/visitor";

type Journey = {
  id: string;
  name: string;
  slug: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
};

type ItineraryItem = {
  id: string;
  day_id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  sort_order: number | null;
};

type ItineraryDay = {
  id: string;
  journey_id: string;
  day_number: number | null;
  date: string | null;
  title: string | null;
  description: string | null;
  items: ItineraryItem[];
};

type JourneyPayload = { journey: Journey | null; days: ItineraryDay[]; unavailable?: boolean };

async function fetchJourneyFromSupabase(slug: string): Promise<JourneyPayload> {
  const { data: journey, error } = await supabase
    .from("journeys")
    .select("id, name, slug, destination, start_date, end_date, status")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!journey) return { journey: null, days: [] };

  const { data: dayRows, error: daysError } = await supabase
    .from("itinerary_days")
    .select("id, journey_id, day_number, date, title, description")
    .eq("journey_id", (journey as Journey).id)
    .order("day_number", { ascending: true });
  if (daysError) throw new Error(daysError.message);

  const days = (dayRows ?? []) as Omit<ItineraryDay, "items">[];
  let items: ItineraryItem[] = [];
  if (days.length > 0) {
    const { data: itemRows, error: itemsError } = await supabase
      .from("itinerary_items")
      .select("id, day_id, title, description, location, start_time, end_time, sort_order")
      .in("day_id", days.map((d) => d.id))
      .order("sort_order", { ascending: true });
    if (itemsError) throw new Error(itemsError.message);
    items = (itemRows ?? []) as ItineraryItem[];
  }

  return {
    journey: journey as Journey,
    days: days.map((d) => ({ ...d, items: items.filter((it) => it.day_id === d.id) })),
  };
}

/**
 * Online: Supabase is the source of truth and the result is written to IndexedDB.
 * Offline (or on a network failure): fall back to the cached copy for this slug.
 */
async function fetchJourney(slug: string): Promise<JourneyPayload & { fromCache: boolean }> {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;

  if (offline) {
    const cached = await readJourneyCache<JourneyPayload>(slug);
    if (cached) return { ...cached.data, fromCache: true };
  }

  try {
    const fresh = await fetchJourneyFromSupabase(slug);
    if (fresh.journey) {
      await writeJourneyCache(slug, fresh);
      // Warm the cache for any image URLs referenced by this journey's own content.
      const text = JSON.stringify(fresh);
      prefetchJourneyAssets(
        text.match(/https?:\/\/[^"'\s)]+\.(?:png|jpe?g|webp|avif|gif|svg)/gi) ?? [],
      );
    }
    return { ...fresh, fromCache: false };
  } catch (err) {
    const cached = await readJourneyCache<JourneyPayload>(slug);
    if (cached) return { ...cached.data, fromCache: true };
    console.error(`[Journey] unable to load ${slug}`, err);
    return { journey: null, days: [], fromCache: false, unavailable: true };
  }
}

const journeyQueryOptions = (slug: string) =>
  queryOptions({ queryKey: ["journey", slug], queryFn: () => fetchJourney(slug) });

export const Route = createFileRoute("/j/$slug")({
  head: () => ({
    meta: [
      { title: "Itinerary — Windsong Travel Africa 2026" },
      { name: "description", content: "Day by day itinerary for the escorted Windsong Travel journey." },
      { property: "og:title", content: "Itinerary — Windsong Travel Africa 2026" },
      { property: "og:description", content: "Every day of the journey, in order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(journeyQueryOptions(params.slug));
  },
  component: JourneyItineraryPage,
  errorComponent: () => (
    <AppShell>
      <BrandHeader />
      <BackButton />
      <div className="px-6 pt-10 text-center">
        <p className="text-xl text-muted-foreground">We could not load the itinerary just now.</p>
        <BigLink to="/" className="mt-6">
          Back to home
        </BigLink>
      </div>
      <PoweredByTapp />
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <BrandHeader />
      <BackButton />
      <div className="px-6 pt-10 text-center">
        <p className="text-xl text-muted-foreground">Journey not found.</p>
        <BigLink to="/" className="mt-6">
          Back to home
        </BigLink>
      </div>
      <PoweredByTapp />
    </AppShell>
  ),
});

function formatTime(value: string | null) {
  if (!value) return null;
  return value.slice(0, 5);
}

function timeLabel(item: ItineraryItem) {
  const start = formatTime(item.start_time);
  const end = formatTime(item.end_time);
  if (start && end) return `${start} – ${end}`;
  return start ?? end;
}

function JourneyItineraryPage() {
  return <JourneyItineraryPageInner />;
}

function OfflineBadge({ offline, fromCache }: { offline: boolean; fromCache: boolean }) {
  if (!offline && !fromCache) return null;
  return (
    <div className="px-6 pt-3">
      <p
        aria-live="polite"
        className="rounded-full bg-gold/25 px-4 py-1.5 text-center text-sm font-semibold text-ink"
      >
        {offline ? "Offline — showing saved journey" : "Showing saved journey"}
      </p>
    </div>
  );
}

function NameEntry({
  journeyId,
  slug,
  onDone,
}: {
  journeyId: string;
  slug: string;
  onDone: (v: VisitorSession) => void;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { online } = useJourney();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = value.trim().slice(0, 80);
    if (!name || saving) return;
    setSaving(true);
    setError(null);
    try {
      onDone(await createVisitor(journeyId, name, slug));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[NameEntry] visitor creation failed", err);
      setError(`We could not start your journey: ${message}`);
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <BrandHeader />
      <OfflineBadge offline={!online} fromCache={false} />
      <form onSubmit={submit} className="mt-10 px-6">
        <h2 className="font-display text-3xl font-semibold text-ink">Welcome 👋</h2>
        <label htmlFor="visitor-name" className="mt-3 block text-xl text-foreground">
          What should we call you?
        </label>
        <input
          id="visitor-name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your name"
          maxLength={80}
          autoComplete="given-name"
          className="mt-4 min-h-16 w-full rounded-3xl border-2 border-input bg-card px-6 text-2xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        {error ? <p className="mt-3 text-lg text-destructive">{error}</p> : null}
        {!online ? (
          <p className="mt-3 text-lg text-muted-foreground">
            You need a signal just once to start your journey. We'll keep everything saved after that.
          </p>
        ) : null}
        <BigButton type="submit" className="mt-6" disabled={!value.trim() || saving || !online}>
          {saving ? "Just a moment…" : "Continue"}
        </BigButton>
      </form>
      <PoweredByTapp />
    </AppShell>
  );
}

function JourneyItineraryPageInner() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(journeyQueryOptions(slug));
  const { online } = useJourney();
  const queryClient = useQueryClient();
  const [visitor, setVisitor] = useState<VisitorSession | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setVisitor(loadVisitor(slug));
    setChecked(true);
  }, [slug]);

  // When the signal comes back, refresh from Supabase and update the local cache.
  useEffect(() => {
    if (online) void queryClient.invalidateQueries({ queryKey: ["journey", slug] });
  }, [online, queryClient, slug]);

  const { journey, days } = data;

  if (!checked) return null;

  if (data.unavailable) {
    return (
      <AppShell>
        <BrandHeader />
        <OfflineBadge offline={!online} fromCache={false} />
        <BackButton />
        <div className="px-6 pt-10 text-center">
          <p className="text-xl text-muted-foreground">
            This journey is temporarily unavailable. Please reconnect and try again.
          </p>
        </div>
        <PoweredByTapp />
      </AppShell>
    );
  }

  if (!journey) {
    return (
      <AppShell>
        <BrandHeader />
        <BackButton />
        <div className="px-6 pt-10 text-center">
          <p className="text-xl text-muted-foreground">Journey not found.</p>
          <BigLink to="/" className="mt-6">
            Back to home
          </BigLink>
        </div>
        <PoweredByTapp />
      </AppShell>
    );
  }

  if (!visitor) {
    return <NameEntry journeyId={journey.id} slug={slug} onDone={setVisitor} />;
  }

  return (
    <AppShell>
      <BrandHeader />
      <OfflineBadge offline={!online} fromCache={data.fromCache} />
      <BackButton />
      <header className="px-6 pt-8">
        <h1 className="font-display text-4xl font-semibold text-ink">{journey.name}</h1>
        <p className="mt-1 text-lg text-muted-foreground">Welcome, {visitor.name} 👋</p>
        {journey.destination ? (
          <p className="mt-2 text-lg text-muted-foreground">{journey.destination}</p>
        ) : null}
      </header>

      {days.length === 0 ? (
        <div className="mt-6 px-6">
          <div className="rounded-3xl bg-card p-6 text-center shadow-[var(--shadow-card)]">
            <p className="text-xl text-muted-foreground">The itinerary has not been added yet.</p>
          </div>
        </div>
      ) : (
        <ol className="mt-6 space-y-3 px-6">
          {days.map((day) => (
            <li key={day.id} className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
              <p className="text-sm font-bold tracking-[0.2em] text-primary uppercase">
                Day {day.day_number}
                {day.date ? ` · ${day.date}` : ""}
              </p>
              {day.title ? (
                <h2 className="font-display mt-1 text-2xl font-semibold text-ink">{day.title}</h2>
              ) : null}
              {day.description ? (
                <p className="mt-2 text-lg leading-relaxed text-foreground">{day.description}</p>
              ) : null}

              {day.items.length === 0 ? null : (
                <ul className="mt-4 space-y-3">
                  {day.items.map((item) => (
                    <li key={item.id} className="rounded-2xl bg-background p-4">
                      {timeLabel(item) ? (
                        <p className="text-base font-semibold text-muted-foreground">{timeLabel(item)}</p>
                      ) : null}
                      {item.title ? (
                        <p className="text-lg font-semibold text-ink">{item.title}</p>
                      ) : null}
                      {item.location ? (
                        <p className="text-base text-muted-foreground">📍 {item.location}</p>
                      ) : null}
                      {item.description ? (
                        <p className="mt-1 text-base leading-relaxed text-foreground">{item.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}

      <PoweredByTapp />
    </AppShell>
  );
}