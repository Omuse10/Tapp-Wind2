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

  const routeStart = new Date("2026-08-05T00:00:00Z");
  const routeEnd = new Date("2026-08-15T23:59:59Z");
  const today = new Date();
  const liveIndex = Math.min(
    stops.length - 1,
    Math.max(
      0,
      Math.floor(((today.getTime() - routeStart.getTime()) / (routeEnd.getTime() - routeStart.getTime())) * stops.length),
    ),
  );
  const activeStop = stops[liveIndex] ?? stops[0];
  const mapPlaces = stops.map((stop) => `${stop.name} ${stop.lat},${stop.lng}`).join("|");
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapPlaces)}&z=6&markers=size:mid|color:green|${stops
    .map((stop) => `${stop.lat},${stop.lng}`)
    .join("&markers=size:mid|color:green|")}&output=embed`;

  return (
    <AppShell>
      <BrandHeader />
      <BackButton />
      <header className="px-6 pt-8">
        <h1 className="font-display text-4xl font-semibold text-ink">OUR JOURNEY</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          A live route through Kenya, with the current stop highlighted as the trip progresses.
        </p>
      </header>

      <div className="mt-6 px-6">
        <section className="overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <p className="text-sm font-bold tracking-[0.2em] text-primary uppercase">Kenya route</p>
            <span className="text-sm text-muted-foreground">Current stop: {activeStop.name}</span>
          </div>
          <div className="h-80 w-full overflow-hidden border-b border-border">
            <iframe
              title="Kenya trip route map"
              src={mapUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
            />
          </div>
          <div className="border-b border-border bg-secondary/30 px-4 py-3">
            <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">Key destinations</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {stops.map((stop) => (
                <span
                  key={stop.id}
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    stop.id === activeStop.id ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                  }`}
                >
                  {stop.name}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-2 p-4">
            {stops.map((stop) => {
              const isActive = stop.id === activeStop.id;
              return (
                <Link
                  key={stop.id}
                  to="/journey/$locationId"
                  params={{ locationId: stop.id }}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 ${
                    isActive ? "border-primary bg-primary/5" : "border-border bg-background"
                  }`}
                >
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">{stop.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {memoriesForLocation(stop.id).length} memories
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    {isActive ? "Current" : "Stop"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

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