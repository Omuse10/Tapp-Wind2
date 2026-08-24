import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell, BrandHeader, ConnectionStatus, PoweredByTapp } from "@/components/journey/AppShell";
import { BackButton } from "@/components/journey/BackButton";
import { BigButton, BigLink } from "@/components/journey/BigButton";
import { InstallWindsongAction } from "@/components/journey/InstallWindsong";
import { useJourney } from "@/lib/journey/store";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "More — Windsong Travel Africa 2026" },
      { name: "description", content: "Your profile, your guide, important contacts, trip information, help and settings." },
      { property: "og:title", content: "More — Windsong Travel Africa 2026" },
      { property: "og:description", content: "Everything else you may need on your Windsong journey." },
    ],
  }),
  component: More,
});

function Panel({
  id,
  icon,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  icon: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="flex min-h-20 w-full items-center gap-4 px-6 text-left"
      >
        <span aria-hidden className="text-3xl">
          {icon}
        </span>
        <span className="font-display min-w-0 flex-1 text-2xl font-semibold text-ink">{title}</span>
        <span aria-hidden className="text-2xl text-muted-foreground">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div id={id} className="space-y-3 px-6 pb-6 text-lg leading-relaxed text-foreground">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function More() {
  const { data, me, setName, resetAll } = useJourney();
  const [open, setOpen] = useState<string | null>(null);
  const [name, setLocalName] = useState(me?.name ?? "");
  const toggle = (id: string) => setOpen((cur) => (cur === id ? null : id));

  return (
    <AppShell>
      <BrandHeader />
      <BackButton />
      <ConnectionStatus />
      <header className="px-6 pt-6">
        <h1 className="font-display text-4xl font-semibold text-ink">More</h1>
      </header>

      <div className="space-y-4 px-6 pt-6">
        <BigLink to="/profile" variant="soft" className="justify-start">
          👤 My profile
        </BigLink>
        <BigLink to="/guide" variant="soft" className="justify-start">
          👤 {data.guides.length > 1 ? "My guides" : "My guide"}
        </BigLink>
        <BigLink to="/full-journey" variant="soft" className="justify-start">
          🗺️ Full journey
        </BigLink>

        <Panel
          id="contacts"
          icon="📞"
          title="Important contacts"
          open={open === "contacts"}
          onToggle={() => toggle("contacts")}
        >
          <p>
            {data.guides.map((g) => (
              <span key={g.id} className="block">
                <strong>
                  Your guide, {g.name}
                </strong>
                <br />
                <a className="text-primary underline" href={`tel:${g.phone}`}>
                  {g.phone}
                </a>
              </span>
            ))}
          </p>
          <p>
            {data.drivers.map((dr) => (
              <span key={dr.id} className="block">
                <strong>Your driver, {dr.name}</strong>
                <br />
                <a className="text-primary underline" href={`tel:${dr.phone}`}>
                  {dr.phone}
                </a>
              </span>
            ))}
          </p>
          <p>
            <strong>Windsong Travel, 24 hours</strong>
            <br />
            <a className="text-primary underline" href="tel:+441512345678">
              +44 151 234 5678
            </a>
          </p>
          <p>
            <strong>Emergency in Kenya</strong>
            <br />
            <a className="text-primary underline" href="tel:999">
              999
            </a>
          </p>
        </Panel>

        <Panel
          id="about"
          icon="ℹ️"
          title="About our trip"
          open={open === "about"}
          onToggle={() => toggle("about")}
        >
          <p className="font-display text-2xl text-ink">{data.trip.name}</p>
          <p>{data.trip.description}</p>
        </Panel>

        <Panel id="help" icon="❓" title="Help" open={open === "help"} onToggle={() => toggle("help")}>
          <p>Press the big buttons at the bottom of the screen to move around.</p>
          <p>
            To add a photograph, press <strong>Memories</strong>, then{" "}
            <strong>Add a memory</strong>.
          </p>
          <p>
            If you have no signal, everything still works. Your photographs are kept safely on your
            phone and sent later.
          </p>
          <p>
            If anything is unclear, please ask {data.guides[0]?.name ?? "your guide"} — he is always
            happy to help.
          </p>
        </Panel>

        <Panel
          id="settings"
          icon="⚙️"
          title="Settings"
          open={open === "settings"}
          onToggle={() => toggle("settings")}
        >
          <label htmlFor="rename" className="block text-lg font-bold text-ink">
            Your name
          </label>
          <input
            id="rename"
            value={name}
            onChange={(e) => setLocalName(e.target.value)}
            className="min-h-16 w-full rounded-3xl border-2 border-input bg-background px-6 text-xl text-foreground focus:border-primary focus:outline-none"
          />
          <BigButton disabled={!name.trim()} onClick={() => setName(name.trim())}>
            Save name
          </BigButton>
          <BigButton variant="soft" onClick={resetAll}>
            Start again
          </BigButton>
          <InstallWindsongAction />
        </Panel>

        <BigLink to="/staff" variant="outline" className="justify-start text-base">
          🔑 Windsong Staff Area
        </BigLink>
      </div>

      <PoweredByTapp />
    </AppShell>
  );
}