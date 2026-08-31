import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell, BrandHeader, PoweredByTapp } from "@/components/journey/AppShell";
import { BackButton } from "@/components/journey/BackButton";
import { BigButton, BigLink } from "@/components/journey/BigButton";
import { LocationDialog } from "@/components/journey/LocationDialog";
import { formatLongDateFromDate, useCurrentDate, useJourney } from "@/lib/journey/journey-context";
import type { LocationRecord } from "@/lib/journey/types";

export const Route = createFileRoute("/today")({
  head: () => ({
    meta: [
      { title: "Today's Plan — Windsong Travel Africa 2026" },
      { name: "description", content: "Your day hour by hour: game drives, meals, locations and today's note from Windsong." },
      { property: "og:title", content: "Today's Plan — Windsong Travel Africa 2026" },
      { property: "og:description", content: "Your day hour by hour, with locations and today's note." },
    ],
  }),
  component: Today,
});

function Today() {
  const { today, todayItems, locationById } = useJourney();
  const now = useCurrentDate();
  const [open, setOpen] = useState<LocationRecord | null>(null);

  return (
    <AppShell>
      <BrandHeader />
      <BackButton />
      <header className="px-6 pt-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">TODAY</h1>
        <p className="mt-2 text-xl text-muted-foreground">{formatLongDateFromDate(now)}</p>
      </header>

      <ol className="mt-6 space-y-4 px-6">
        {todayItems.map((item) => {
          const loc = locationById(item.locationId);
          return (
            <li key={item.id} className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
              <p className="text-2xl font-extrabold text-primary">{item.time}</p>
              <p className="font-display mt-1 text-3xl font-semibold text-ink">
                {item.emoji} {item.title}
              </p>
              <p className="mt-2 text-lg text-muted-foreground">📍 {loc?.name}</p>
              <BigButton
                variant="soft"
                className="mt-4"
                onClick={() => setOpen(loc ?? null)}
              >
                View location
              </BigButton>
            </li>
          );
        })}
      </ol>

      <section className="mt-6 px-6">
        <div className="rounded-3xl bg-sand p-6">
          <p className="text-sm font-bold tracking-[0.2em] text-sand-foreground uppercase">Today's note</p>
          <p className="mt-3 text-xl leading-relaxed text-ink">{today.note}</p>
        </div>
      </section>

      <div className="mt-6 px-6">
        <BigLink to="/full-journey" variant="outline">
          Full journey
        </BigLink>
      </div>

      <PoweredByTapp />
      <LocationDialog location={open} onClose={() => setOpen(null)} />
    </AppShell>
  );
}