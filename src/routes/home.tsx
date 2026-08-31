import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import guideImg from "@/assets/guide.jpg";
import { resolveImage } from "@/lib/journey/images";
import {
  AppShell,
  BrandHeader,
  ConnectionStatus,
  PoweredByTapp,
} from "@/components/journey/AppShell";
import { BigLink } from "@/components/journey/BigButton";
import { TodaysUpdateCard, TodaysUpdatePopup } from "@/components/journey/TodaysUpdate";
import { WordOfTheDay } from "@/components/journey/WordOfTheDay";
import { formatLongDateFromDate, greeting, useCurrentDate, useJourney } from "@/lib/journey/journey-context";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — Windsong Travel Africa 2026" },
      {
        name: "description",
        content: "Your morning briefing: today's adventure, the Swahili word of the day and your guide.",
      },
      { property: "og:title", content: "Home — Windsong Travel Africa 2026" },
      { property: "og:description", content: "Today's adventure, your guide and your group's memories." },
    ],
  }),
  component: Home,
});

const ACTIONS = [
  { to: "/add-memory", icon: "📸", label: "Add memory" },
  { to: "/animals", icon: "🐾", label: "Animal checklist" },
  { to: "/memories", icon: "🖼️", label: "Our memories" },
  { to: "/journey", icon: "🗺️", label: "Our journey" },
] as const;

function Home() {
  const { me, ready, today, todayItems, locationById, data } = useJourney();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !me) navigate({ to: "/", replace: true });
  }, [ready, me, navigate]);

  const now = useCurrentDate();
  const [hello, setHello] = useState<{ text: string; emoji: string }>({
    text: "Hello",
    emoji: "👋",
  });
  useEffect(() => setHello(greeting(now)), [now]);

  const guide = data.guides[0];
  const first = todayItems[0];
  const firstLocation = first ? locationById(first.locationId) : undefined;
  return (
    <AppShell>
      <BrandHeader />
      <ConnectionStatus />

      <div className="space-y-6 px-6 pt-6">
        <div>
          <h1 className="font-display text-4xl font-semibold text-ink">
            {hello.text}, {me?.name ?? "friend"} {hello.emoji}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">{formatLongDateFromDate(now)}</p>
        </div>

        <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <p className="text-sm font-bold tracking-[0.2em] text-primary uppercase">Today's adventure</p>
          {first ? (
            <>
              <p className="font-display mt-3 text-3xl font-semibold text-ink">
                {first.emoji} {first.title}
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{first.time}</p>
              <p className="mt-1 text-lg text-muted-foreground">📍 {firstLocation?.name}</p>
            </>
          ) : (
            <p className="mt-3 text-xl text-muted-foreground">A restful day — nothing planned.</p>
          )}
          <BigLink to="/today" className="mt-5">
            View today's plan
          </BigLink>
        </section>

        <TodaysUpdateCard />

        <WordOfTheDay />

        <div className="grid grid-cols-2 gap-4">
          {ACTIONS.map((a) => (
            <BigLink
              key={a.to}
              to={a.to}
              variant="soft"
              className="min-h-36 flex-col gap-2 text-center text-base leading-tight"
            >
              <span aria-hidden className="text-4xl">
                {a.icon}
              </span>
              {a.label}
            </BigLink>
          ))}
        </div>

        <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <p className="text-sm font-bold tracking-[0.2em] text-primary uppercase">Your guide</p>
          <div className="mt-4 flex items-center gap-4">
            <img
              src={guide?.photo ? resolveImage(guide.photo) : guideImg}
              alt={guide?.name ?? "Your guide"}
              width={800}
              height={800}
              loading="lazy"
              className="size-20 shrink-0 rounded-2xl object-cover"
            />
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold text-ink">{guide?.name}</p>
              <p className="text-lg text-muted-foreground">{guide?.role}</p>
            </div>
          </div>
          <BigLink to="/guide" variant="outline" className="mt-5">
            {data.guides.length > 1 ? "View guides" : "View guide"}
          </BigLink>
        </section>
      </div>

      <PoweredByTapp />
      <TodaysUpdatePopup />
    </AppShell>
  );
}