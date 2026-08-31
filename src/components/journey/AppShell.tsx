import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useJourney } from "@/lib/journey/journey-context";
import { cn } from "@/lib/utils";
import logo from "@/assets/wind2-.png";

const NAV = [
  { to: "/home", label: "Home", icon: "🏠" },
  { to: "/today", label: "Today", icon: "📅" },
  { to: "/memories", label: "Memories", icon: "📸" },
  { to: "/journey", label: "Journey", icon: "🗺️" },
  { to: "/more", label: "More", icon: "☰" },
] as const;

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  const { data } = useJourney();
  return (
    <div className="px-6 pt-6 text-center">
      <img src={logo} alt="Windsong Travel" className="mx-auto h-20 w-auto object-contain" />
      <p className="mt-1 text-sm font-semibold tracking-[0.3em] text-primary uppercase">
        {subtitle ?? data.trip.name}
      </p>
    </div>
  );
}

export function ConnectionStatus() {
  const { online, syncing } = useJourney();
  return (
    <div className="px-6 pt-4">
      <div
        className={cn(
          "flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
          online ? "bg-secondary text-secondary-foreground" : "bg-gold/25 text-ink",
        )}
        aria-live="polite"
      >
        {syncing ? (
          <span>☁️ Uploading your memories…</span>
        ) : online ? (
          <span>🟢 Connected</span>
        ) : (
          <span>🟠 Offline — memories will upload when connected</span>
        )}
      </div>
    </div>
  );
}

export function PoweredByTapp() {
  return (
    <p className="pt-8 pb-2 text-center text-xs tracking-[0.2em] text-muted-foreground uppercase">
      Powered by Tapp
    </p>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="px-6 pt-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">{title}</h1>
      {subtitle ? <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1 pb-[env(safe-area-inset-bottom)]">
        {NAV.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-xs font-bold",
                  active ? "bg-secondary text-primary" : "text-muted-foreground",
                )}
              >
                <span aria-hidden className="text-2xl leading-none">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background pb-28">
      <div className="mx-auto w-full max-w-lg">{children}</div>
      <BottomNav />
    </div>
  );
}
