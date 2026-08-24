import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, BrandHeader, PoweredByTapp } from "@/components/journey/AppShell";
import { BackButton } from "@/components/journey/BackButton";
import { BigLink } from "@/components/journey/BigButton";
import { resolveImage } from "@/lib/journey/images";
import { useJourney } from "@/lib/journey/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Windsong Travel Africa 2026" },
      { name: "description", content: "Your name, your photographs and the animals you have spotted on the Africa 2026 journey." },
      { property: "og:title", content: "My Profile — Windsong Travel Africa 2026" },
      { property: "og:description", content: "Your own photographs from the journey." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { me, data, memoriesForGuest } = useJourney();
  const mine = me ? memoriesForGuest(me.id) : [];

  return (
    <AppShell>
      <BrandHeader />
      <BackButton />
      <header className="px-6 pt-8">
        <h1 className="font-display text-4xl font-semibold tracking-wide text-ink uppercase">
          {me?.name ?? "Guest"}
        </h1>
        <p className="mt-2 text-xl text-muted-foreground">
          {mine.length} {mine.length === 1 ? "memory" : "memories"} · {data.sightings.length} animals seen
        </p>
      </header>

      <div className="px-6 pt-6">
        {mine.length === 0 ? (
          <div className="rounded-3xl bg-card p-8 text-center shadow-[var(--shadow-card)]">
            <p className="text-5xl">📸</p>
            <p className="mt-4 text-xl text-muted-foreground">Your photographs will appear here.</p>
            <BigLink to="/add-memory" className="mt-6">
              📸 Add your first memory
            </BigLink>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {mine.map((m) => (
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
                <p className="p-3 text-base text-muted-foreground">📍 {m.locationName}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
      <PoweredByTapp />
    </AppShell>
  );
}