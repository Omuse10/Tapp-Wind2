import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, BrandHeader, ConnectionStatus, PoweredByTapp } from "@/components/journey/AppShell";
import { BackButton } from "@/components/journey/BackButton";
import { BigLink } from "@/components/journey/BigButton";
import { resolveImage } from "@/lib/journey/images";
import { formatShortDate, useJourney } from "@/lib/journey/store";

export const Route = createFileRoute("/memories/")({
  head: () => ({
    meta: [
      { title: "Our Memories — Windsong Travel Africa 2026" },
      { name: "description", content: "Photographs and stories shared by everyone travelling on the Africa 2026 journey." },
      { property: "og:title", content: "Our Memories — Windsong Travel Africa 2026" },
      { property: "og:description", content: "The group's shared photo album from Kenya." },
    ],
  }),
  component: MemoriesFeed,
});

function MemoriesFeed() {
  const { data, likeCount, hasLiked, toggleLike, commentsFor } = useJourney();
  const memories = [...data.memories].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <AppShell>
      <BrandHeader />
      <BackButton />
      <ConnectionStatus />
      <header className="px-6 pt-6">
        <h1 className="font-display text-4xl font-semibold text-ink">OUR MEMORIES</h1>
        <p className="mt-2 text-lg text-muted-foreground">Photographs from everyone in our group.</p>
      </header>

      <div className="px-6 pt-6">
        <BigLink to="/add-memory">📸 Add a memory</BigLink>
      </div>

      {memories.length === 0 ? (
        <div className="mt-8 px-6">
          <div className="rounded-3xl bg-card p-8 text-center shadow-[var(--shadow-card)]">
            <p className="text-5xl">🖼️</p>
            <p className="mt-4 text-xl text-muted-foreground">
              Your group's memories will appear here.
            </p>
            <BigLink to="/add-memory" className="mt-6">
              📸 Add the first memory
            </BigLink>
          </div>
        </div>
      ) : (
        <ul className="mt-6 space-y-6 px-6">
          {memories.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
              <div className="flex items-baseline justify-between gap-3 px-5 pt-5">
                <div className="min-w-0">
                  <p className="font-display text-2xl font-semibold text-ink">{m.guestName}</p>
                  <p className="text-base text-muted-foreground">📍 {m.locationName}</p>
                </div>
                <p className="shrink-0 text-base text-muted-foreground">{formatShortDate(m.createdAt)}</p>
              </div>
              <Link to="/memories/$memoryId" params={{ memoryId: m.id }} className="mt-4 block">
                <img
                  src={resolveImage(m.photo)}
                  alt={m.description}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              </Link>
              <div className="p-5">
                {m.pending ? (
                  <p className="mb-3 text-base font-semibold text-primary">
                    🟠 Saved on this phone — will upload when connected
                  </p>
                ) : null}
                <p className="text-lg leading-relaxed text-foreground">{m.description}</p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleLike(m.id)}
                    aria-label={hasLiked(m.id) ? "Remove your like" : "Like this memory"}
                    className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-secondary text-lg font-bold text-secondary-foreground"
                  >
                    {hasLiked(m.id) ? "❤️" : "🤍"} {likeCount(m.id)}
                  </button>
                  <Link
                    to="/memories/$memoryId"
                    params={{ memoryId: m.id }}
                    className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-secondary text-lg font-bold text-secondary-foreground"
                  >
                    💬 {commentsFor(m.id).length}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <PoweredByTapp />
    </AppShell>
  );
}