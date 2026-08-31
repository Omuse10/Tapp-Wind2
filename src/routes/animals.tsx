import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, BrandHeader, PoweredByTapp } from "@/components/journey/AppShell";
import { BackButton } from "@/components/journey/BackButton";
import { useJourney } from "@/lib/journey/journey-context";

export const Route = createFileRoute("/animals")({
  head: () => ({
    meta: [
      { title: "Animal Checklist — Windsong Travel Africa 2026" },
      { name: "description", content: "Tick off the animals you spot on safari and add a photograph of each sighting." },
      { property: "og:title", content: "Animal Checklist — Windsong Travel Africa 2026" },
      { property: "og:description", content: "The Big Five and more — tick them off as you see them." },
    ],
  }),
  component: Animals,
});

function Animals() {
  const { data, sightingFor, markAnimalSeen, unmarkAnimal } = useJourney();
  const categories = [...new Set(data.animals.map((a) => a.category))];
  const seen = data.sightings.length;

  return (
    <AppShell>
      <BrandHeader />
      <BackButton />
      <header className="px-6 pt-8">
        <h1 className="font-display text-4xl font-semibold text-ink">🐾 Animal checklist</h1>
        <p className="mt-2 text-xl font-bold text-primary">
          {seen} / {data.animals.length} animals seen
        </p>
        <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(seen / data.animals.length) * 100}%` }}
          />
        </div>
        {seen === 0 ? (
          <div className="mt-6 rounded-3xl bg-sand p-6">
            <p className="font-display text-2xl text-ink">Your adventure is just beginning.</p>
            <p className="mt-2 text-lg text-sand-foreground">If you spot an animal, tap it here.</p>
          </div>
        ) : null}
      </header>

      {categories.map((category) => (
        <section key={category} className="mt-8 px-6">
          <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase">{category}</h2>
          <ul className="mt-3 space-y-3">
            {data.animals
              .filter((a) => a.category === category)
              .map((a) => {
                const sighting = sightingFor(a.id);
                return (
                  <li key={a.id} className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
                    <div className="flex items-center gap-4">
                      <span aria-hidden className="text-4xl">
                        {a.emoji}
                      </span>
                      <p className="font-display min-w-0 flex-1 text-2xl font-semibold text-ink">
                        {a.name}
                      </p>
                      {sighting ? <span className="text-3xl text-accent">✓</span> : null}
                    </div>

                    {sighting?.photo ? (
                      <img
                        src={sighting.photo}
                        alt={`${a.name} sighting`}
                        className="mt-4 h-40 w-full rounded-2xl object-cover"
                      />
                    ) : null}
                    {sighting?.note ? (
                      <p className="mt-3 text-lg text-foreground">{sighting.note}</p>
                    ) : null}

                    {sighting ? (
                      <div className="mt-4 space-y-3">
                        <Link
                          to="/add-memory"
                          search={{ animal: a.id }}
                          className="flex min-h-14 items-center justify-center rounded-2xl bg-secondary text-lg font-bold text-secondary-foreground"
                        >
                          📸 {sighting.photo ? "Add another photo" : "Add photo"}
                        </Link>
                        <button
                          type="button"
                          onClick={() => unmarkAnimal(a.id)}
                          className="min-h-14 w-full rounded-2xl border-2 border-input text-lg font-bold text-muted-foreground"
                        >
                          Not seen yet
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markAnimalSeen(a)}
                        className="mt-4 min-h-16 w-full rounded-2xl bg-primary text-lg font-extrabold tracking-wide text-primary-foreground uppercase"
                      >
                        I saw it!
                      </button>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}

      <PoweredByTapp />
    </AppShell>
  );
}