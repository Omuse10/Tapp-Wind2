import { createFileRoute, Link, useParams } from "@tanstack/react-router";

import { AppShell, BrandHeader, PoweredByTapp } from "@/components/journey/AppShell";
import { BackButton } from "@/components/journey/BackButton";
import { BigLink } from "@/components/journey/BigButton";
import { MapsLink } from "@/components/journey/MapsLink";
import { resolveImage } from "@/lib/journey/images";
import { useJourney } from "@/lib/journey/journey-context";

export const Route = createFileRoute("/journey/$locationId")({
  head: () => ({
    meta: [
      { title: "Destination — Windsong Travel Africa 2026" },
      { name: "description", content: "A destination on the Africa 2026 journey and the photographs taken there." },
      { property: "og:title", content: "Destination — Windsong Travel Africa 2026" },
      { property: "og:description", content: "See this place and the group's photographs from it." },
    ],
  }),
  component: DestinationPage,
});

function DestinationPage() {
  const { locationId } = useParams({ from: "/journey/$locationId" });
  const { locationById, memoriesForLocation } = useJourney();
  const location = locationById(locationId);
  const memories = location ? memoriesForLocation(location.id) : [];

  if (!location) {
    return (
      <AppShell>
        <BrandHeader />
        <BackButton />
        <div className="px-6 pt-10 text-center">
          <p className="text-xl text-muted-foreground">We could not find that place.</p>
          <BigLink to="/journey" className="mt-6">
            Back to our journey
          </BigLink>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <BackButton />
      <img
        src={resolveImage(location.imageKey ?? "hero")}
        alt={location.name}
        className="h-56 w-full object-cover"
      />
      <header className="px-6 pt-6">
        <h1 className="font-display text-4xl font-semibold text-ink">{location.name}</h1>
        <p className="mt-3 text-lg leading-relaxed text-foreground">{location.description}</p>
        <MapsLink
          lat={location.lat}
          lng={location.lng}
          label={location.name}
          className="mt-5 flex min-h-16 items-center justify-center rounded-3xl bg-secondary text-lg font-extrabold tracking-wide text-secondary-foreground uppercase"
        >
          📍 Open in Maps
        </MapsLink>
      </header>

      <section className="mt-8 px-6">
        <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase">
          Memories here ({memories.length})
        </h2>
        {memories.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-card p-6 text-center shadow-[var(--shadow-card)]">
            <p className="text-xl text-muted-foreground">No photographs from here yet.</p>
            <BigLink to="/add-memory" className="mt-5">
              📸 Add the first memory
            </BigLink>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {memories.map((m) => (
              <Link
                key={m.id}
                to="/memories/$memoryId"
                params={{ memoryId: m.id }}
                className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]"
              >
                <img
                  src={resolveImage(m.photo)}
                  alt={m.description}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                <p className="p-3 text-base font-semibold text-ink">{m.guestName}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <PoweredByTapp />
    </AppShell>
  );
}