import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { PoweredByTapp } from "@/components/journey/AppShell";
import { BigButton } from "@/components/journey/BigButton";
import heroImg from "@/assets/hero-savanna.jpg";
import logo from "@/assets/wind2-.png";
import { useJourney } from "@/lib/journey/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Windsong Travel — Africa 2026 Journey" },
      {
        name: "description",
        content:
          "Your private travel companion for the Windsong Travel Africa 2026 escorted journey: today's plan, your guide, and your group's photo memories.",
      },
      { property: "og:title", content: "Windsong Travel — Africa 2026 Journey" },
      {
        property: "og:description",
        content: "Your journey. Your memories. A private companion for Windsong Travel guests.",
      },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const { me, ready, setName } = useJourney();
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && me) navigate({ to: "/home", replace: true });
  }, [ready, me, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    setName(name);
    navigate({ to: "/home", replace: true });
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-lg">
        <div className="relative h-64 overflow-hidden">
          <img
            src={heroImg}
            alt="Sunrise over the African savanna with an acacia tree"
            width={1280}
            height={960}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        <div className="-mt-10 px-6 text-center">
          <img
            src={logo}
            alt="Windsong Travel"
            className="mx-auto h-24 w-auto object-contain"
          />
          <p className="mt-2 text-lg font-bold tracking-[0.35em] text-primary uppercase">Africa 2026</p>
          <p className="font-display mt-4 text-2xl text-muted-foreground italic">
            Your journey. Your memories.
          </p>
        </div>

        <form onSubmit={submit} className="mt-10 px-6">
          <h2 className="font-display text-3xl font-semibold text-ink">Welcome 👋</h2>
          <label htmlFor="guest-name" className="mt-3 block text-xl text-foreground">
            What should we call you?
          </label>
          <input
            id="guest-name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your name"
            autoComplete="given-name"
            className="mt-4 min-h-16 w-full rounded-3xl border-2 border-input bg-card px-6 text-2xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <BigButton type="submit" className="mt-6" disabled={!value.trim()}>
            Continue
          </BigButton>
        </form>

        <PoweredByTapp />
      </div>
    </div>
  );
}
