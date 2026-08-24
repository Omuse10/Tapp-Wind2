import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, BrandHeader, PoweredByTapp } from "@/components/journey/AppShell";
import { BackButton } from "@/components/journey/BackButton";
import { resolveImage } from "@/lib/journey/images";
import { useJourney } from "@/lib/journey/store";

export const Route = createFileRoute("/journey/")({
  head: () => ({
    meta: [
      { title: "Our Journey — Windsong Travel Africa 2026" },
      { name: "description", content: "Every destination of the Africa 2026 journey, with the photographs taken there." },
      { property: "og:title", content: "Our Journey — Windsong Travel Africa 2026" },
      { property: "og:description", content: "Follow the route from Nairobi to the Maasai Mara through the group's photographs." },
    ],
  }),
  component: JourneyIndex,
});

function JourneyIndex() {
  const { data, memoriesForLocation } = useJourney();
  const stops = data.locations.filter((l) => l.id !== "loc-camp").sort((a, b) => a.order - b.order);

  return (
    <AppShell>
      <BrandHeader />
      <BackButton />
      <header className="px-6 pt-8">
        <h1 className="font-display text-4xl font-semibold text-ink">OUR JOURNEY</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tap a place to see its photographs.</p>
      </header>

      <div className="mt-6 px-6">
        {stops.map((stop, i) => (
          <div key={stop.id}>
            <Link
              to="/journey/$locationId"
              params={{ locationId: stop.id }}
              className="block overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]"
            >
              <img
                src={resolveImage(stop.imageKey ?? "hero")}
                alt={stop.name}
                loading="lazy"
                className="h-40 w-full object-cover"
              />
              <div className="p-5">
                <p className="font-display text-2xl font-semibold text-ink">📍 {stop.name}</p>
                <p className="mt-1 text-lg text-muted-foreground">
                  {memoriesForLocation(stop.id).length} memories
                </p>
              </div>
            </Link>
            {i < stops.length - 1 ? (
              <p aria-hidden className="py-3 text-center text-3xl text-muted-foreground">
                ↓
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <PoweredByTapp />
    </AppShell>
  );
}