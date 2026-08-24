import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, BrandHeader, PoweredByTapp } from "@/components/journey/AppShell";
import { BackButton } from "@/components/journey/BackButton";
import { useJourney } from "@/lib/journey/store";

export const Route = createFileRoute("/full-journey")({
  head: () => ({
    meta: [
      { title: "Full Journey — Windsong Travel Africa 2026" },
      { name: "description", content: "The whole trip at a glance: every destination from Nairobi to the Maasai Mara." },
      { property: "og:title", content: "Full Journey — Windsong Travel Africa 2026" },
      { property: "og:description", content: "Every destination of the Africa 2026 escorted journey." },
    ],
  }),
  component: FullJourney,
});

function FullJourney() {
  const { data } = useJourney();
  const stops = data.locations.filter((l) => l.id !== "loc-camp").sort((a, b) => a.order - b.order);

  return (
    <AppShell>
      <BrandHeader />
      <BackButton />
      <header className="px-6 pt-8">
        <h1 className="font-display text-4xl font-semibold text-ink">FULL JOURNEY</h1>
        <p className="mt-2 text-lg text-muted-foreground">Where we have been, and where we are going.</p>
      </header>

      <ol className="mt-6 space-y-3 px-6">
        {stops.map((stop) => (
          <li key={stop.id}>
            <Link
              to="/journey/$locationId"
              params={{ locationId: stop.id }}
              className="flex min-h-20 items-center gap-4 rounded-3xl bg-card px-6 py-4 shadow-[var(--shadow-card)]"
            >
              <span aria-hidden className="text-3xl">
                {stop.status === "visited" ? "✓" : "→"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-display block text-2xl font-semibold text-ink">{stop.name}</span>
                <span className="block text-base text-muted-foreground">
                  {stop.status === "visited" ? "Visited" : "Still to come"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <PoweredByTapp />
    </AppShell>
  );
}