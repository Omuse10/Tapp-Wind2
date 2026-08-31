import { useEffect, useState } from "react";

import { useJourney } from "@/lib/journey/journey-context";

const DISMISSED_KEY = "windsong-dismissed-updates";

function readDismissed(): string[] {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** The published update, shown on Home in the existing card style. */
export function TodaysUpdateCard() {
  const { activeUpdate } = useJourney();
  if (!activeUpdate) return null;
  return (
    <section className="rounded-3xl bg-sand p-6">
      <p className="text-sm font-bold tracking-[0.2em] text-sand-foreground uppercase">
        📢 {activeUpdate.title}
      </p>
      <p className="mt-3 text-xl leading-relaxed text-ink">{activeUpdate.message}</p>
    </section>
  );
}

/** Small, dismissable popup for a newly published update. */
export function TodaysUpdatePopup() {
  const { activeUpdate } = useJourney();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!activeUpdate) {
      setOpen(false);
      return;
    }
    setOpen(!readDismissed().includes(`${activeUpdate.id}:${activeUpdate.publishedAt}`));
  }, [activeUpdate]);

  if (!activeUpdate || !open) return null;

  const dismiss = () => {
    try {
      const key = `${activeUpdate.id}:${activeUpdate.publishedAt}`;
      window.localStorage.setItem(DISMISSED_KEY, JSON.stringify([...readDismissed(), key]));
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={activeUpdate.title}
        className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold tracking-[0.2em] text-ink uppercase">
              Windsong Travel
            </p>
            <p className="mt-1 text-sm font-bold tracking-[0.2em] text-primary uppercase">
              {activeUpdate.title}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="-mt-2 -mr-2 flex size-12 items-center justify-center rounded-full text-3xl text-muted-foreground"
          >
            ×
          </button>
        </div>
        <p className="mt-4 text-xl leading-relaxed text-foreground">{activeUpdate.message}</p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-6 flex min-h-16 w-full items-center justify-center rounded-3xl bg-primary text-lg font-extrabold tracking-wide text-primary-foreground uppercase"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
