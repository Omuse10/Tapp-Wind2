import { createFileRoute } from "@tanstack/react-router";

import guideImg from "@/assets/guide.jpg";
import { AppShell, BrandHeader, PoweredByTapp } from "@/components/journey/AppShell";
import { BackButton } from "@/components/journey/BackButton";
import { resolveImage } from "@/lib/journey/images";
import { useJourney } from "@/lib/journey/journey-context";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Your Guide — Windsong Travel Africa 2026" },
      { name: "description", content: "Meet your Windsong safari guides and driver, and reach them whenever you need help." },
      { property: "og:title", content: "Your Guide — Windsong Travel Africa 2026" },
      { property: "og:description", content: "Meet your safari guide and call or message him any time." },
    ],
  }),
  component: GuidePage,
});

const callClass =
  "mt-6 flex min-h-16 items-center justify-center rounded-3xl bg-primary text-lg font-extrabold tracking-wide text-primary-foreground uppercase";
const waClass =
  "mt-3 flex min-h-16 items-center justify-center rounded-3xl bg-secondary text-lg font-extrabold tracking-wide text-secondary-foreground uppercase";

function GuidePage() {
  const { data } = useJourney();

  return (
    <AppShell>
      <BrandHeader />
      <BackButton />
      <header className="px-6 pt-8">
        <h1 className="font-display text-4xl font-semibold text-ink">
          {data.guides.length > 1 ? "Your guides" : "Your guide"}
        </h1>
      </header>

      {data.guides.map((g) => (
        <div key={g.id} className="px-6 pt-6">
          <img
            src={g.photo ? resolveImage(g.photo) : guideImg}
            alt={g.name}
            width={800}
            height={800}
            className="aspect-square w-full rounded-3xl object-cover"
          />
          <p className="font-display mt-5 text-3xl font-semibold text-ink">{g.name}</p>
          <p className="text-xl text-muted-foreground">{g.role}</p>
          {g.experience ? <p className="text-xl text-muted-foreground">{g.experience}</p> : null}
          {g.about ? <p className="mt-4 text-lg leading-relaxed text-foreground">{g.about}</p> : null}

          {g.phone ? (
            <a href={`tel:${g.phone}`} className={callClass}>
              📞 Call guide
            </a>
          ) : null}
          {g.whatsapp ? (
            <a
              href={`https://wa.me/${g.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className={waClass}
            >
              💬 WhatsApp guide
            </a>
          ) : null}
        </div>
      ))}

      {data.drivers.length > 0 ? (
        <section className="px-6 pt-10">
          <h2 className="font-display text-4xl font-semibold text-ink">
            {data.drivers.length > 1 ? "Your drivers" : "Your driver"}
          </h2>
          {data.drivers.map((dr) => (
            <div key={dr.id} className="pt-6">
              {dr.photo ? (
                <img
                  src={resolveImage(dr.photo)}
                  alt={dr.name}
                  className="aspect-square w-full rounded-3xl object-cover"
                />
              ) : null}
              <p className="font-display mt-2 text-3xl font-semibold text-ink">{dr.name}</p>
              <p className="text-xl text-muted-foreground">{dr.role}</p>
              {dr.about ? (
                <p className="mt-4 text-lg leading-relaxed text-foreground">{dr.about}</p>
              ) : null}
              {dr.phone ? (
                <a href={`tel:${dr.phone}`} className={callClass}>
                  📞 Call driver
                </a>
              ) : null}
              {dr.whatsapp ? (
                <a
                  href={`https://wa.me/${dr.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className={waClass}
                >
                  💬 WhatsApp driver
                </a>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      <PoweredByTapp />
    </AppShell>
  );
}
