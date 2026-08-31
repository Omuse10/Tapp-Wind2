import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { compressImage, resolveImage } from "@/lib/journey/images";
import { formatShortDate, useJourney } from "@/lib/journey/journey-context";
import { signOutStaff } from "@/lib/staff/auth";
import { StaffItinerary } from "@/components/journey/StaffItinerary";

const TABS = [
  { id: "itinerary", label: "📅 Itinerary" },
  { id: "update", label: "📢 Today's Update" },
  { id: "words", label: "🇰🇪 Swahili Words" },
  { id: "animals", label: "🐾 Animals" },
  { id: "locations", label: "📍 Locations" },
  { id: "guests", label: "👥 Guests" },
  { id: "activity", label: "📊 Guest Activity" },
  { id: "guide", label: "👤 Guides & Driver" },
] as const;

const field =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground focus:border-primary focus:outline-none";
const card = "rounded-lg border border-border bg-card p-4";

export function ManagerDashboard({ staffEmail }: { staffEmail?: string }) {
  const {
    data,
    update,
    today,
    activeUpdate,
    publishUpdate,
    deleteUpdate,
    addGuide,
    saveGuide,
    deleteGuide,
    addDriver,
    saveDriver,
    deleteDriver,
  } = useJourney();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("itinerary");
  const [updateTitle, setUpdateTitle] = useState("Important update");
  const [updateMessage, setUpdateMessage] = useState("");
  const [confirmDeleteUpdate, setConfirmDeleteUpdate] = useState(false);
  const [confirmDeleteGuide, setConfirmDeleteGuide] = useState<string | null>(null);
  const [confirmDeleteDriver, setConfirmDeleteDriver] = useState<string | null>(null);
  const [newAnimal, setNewAnimal] = useState({ name: "", emoji: "🐾", category: "OTHER WILDLIFE" });

  return (
    <div className="min-h-dvh bg-secondary/40">
      <header className="border-b border-border bg-ink px-6 py-5 text-primary-foreground">
        <p className="text-sm font-bold tracking-[0.25em] uppercase opacity-80">
          Windsong Journey Manager · Internal staff area
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold">{data.trip.name}</h1>
        {staffEmail ? (
          <p className="mt-1 text-sm opacity-80">Signed in as {staffEmail}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Link to="/home" className="inline-block text-sm underline opacity-90">
            ← Back to the guest app
          </Link>
          <button
            type="button"
            onClick={() => void signOutStaff()}
            className="rounded-full border border-primary-foreground/40 px-3 py-1 text-sm font-semibold uppercase"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <nav className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 space-y-4">
          {tab === "itinerary" ? (
            <StaffItinerary />
          ) : null}

          {tab === "update" ? (
            <>
              <div className={card}>
                <label className="text-lg font-bold text-ink" htmlFor="note">
                  Today's note to guests
                </label>
                <textarea
                  id="note"
                  rows={4}
                  className={`${field} mt-2`}
                  value={today.note}
                  onChange={(e) =>
                    update((d) => ({
                      ...d,
                      days: d.days.map((day) => (day.id === today.id ? { ...day, note: e.target.value } : day)),
                    }))
                  }
                />
              </div>

              <div className={`${card} space-y-3`}>
                <h2 className="text-lg font-bold text-ink">Today's Update</h2>
                <p className="text-sm text-muted-foreground">
                  Appears on the guest Home page and as a small popup. Expires automatically after 12
                  hours.
                </p>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground" htmlFor="upd-title">
                    Title
                  </label>
                  <input
                    id="upd-title"
                    className={field}
                    value={updateTitle}
                    onChange={(e) => setUpdateTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground" htmlFor="upd-message">
                    Message
                  </label>
                  <textarea
                    id="upd-message"
                    rows={3}
                    className={field}
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  disabled={!updateMessage.trim()}
                  className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground uppercase disabled:opacity-50"
                  onClick={() => {
                    publishUpdate({
                      title: updateTitle,
                      message: updateMessage,
                      ...(activeUpdate ? { id: activeUpdate.id } : {}),
                    });
                  }}
                >
                  {activeUpdate ? "Publish update (replaces current)" : "Publish update"}
                </button>

                {activeUpdate ? (
                  <div className="mt-4 space-y-2 rounded-lg border border-border bg-background p-3">
                    <p className="text-sm font-bold tracking-[0.2em] text-primary uppercase">
                      Live now
                    </p>
                    <p className="font-semibold text-ink">{activeUpdate.title}</p>
                    <p className="text-foreground">{activeUpdate.message}</p>
                    <p className="text-sm text-muted-foreground">
                      Published {formatShortDate(activeUpdate.publishedAt)} · expires{" "}
                      {new Date(activeUpdate.expiresAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {confirmDeleteUpdate ? (
                      <div className="space-y-2">
                        <p className="font-semibold text-ink">Delete today's update?</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold uppercase"
                            onClick={() => setConfirmDeleteUpdate(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground uppercase"
                            onClick={() => {
                              deleteUpdate(activeUpdate.id);
                              setConfirmDeleteUpdate(false);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-destructive uppercase"
                        onClick={() => setConfirmDeleteUpdate(true)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No update is live at the moment.</p>
                )}
              </div>
            </>
          ) : null}

          {tab === "words" ? (
            <>
              <h2 className="text-lg font-bold text-ink">Swahili word of the day</h2>
              {data.words.map((w) => (
                <div key={w.id} className={`${card} grid gap-3 sm:grid-cols-4`}>
                  <input
                    aria-label="Date"
                    className={field}
                    value={w.date}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        words: d.words.map((x) => (x.id === w.id ? { ...x, date: e.target.value } : x)),
                      }))
                    }
                  />
                  <input
                    aria-label="Word"
                    className={field}
                    value={w.word}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        words: d.words.map((x) => (x.id === w.id ? { ...x, word: e.target.value } : x)),
                      }))
                    }
                  />
                  <input
                    aria-label="Meaning"
                    className={field}
                    value={w.meaning}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        words: d.words.map((x) => (x.id === w.id ? { ...x, meaning: e.target.value } : x)),
                      }))
                    }
                  />
                  <input
                    aria-label="Pronunciation"
                    className={field}
                    value={w.pronunciation}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        words: d.words.map((x) =>
                          x.id === w.id ? { ...x, pronunciation: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </>
          ) : null}

          {tab === "animals" ? (
            <>
              <div className={`${card} grid gap-3 sm:grid-cols-4`}>
                <input
                  aria-label="New animal emoji"
                  className={field}
                  value={newAnimal.emoji}
                  onChange={(e) => setNewAnimal({ ...newAnimal, emoji: e.target.value })}
                />
                <input
                  aria-label="New animal name"
                  placeholder="Animal name"
                  className={field}
                  value={newAnimal.name}
                  onChange={(e) => setNewAnimal({ ...newAnimal, name: e.target.value })}
                />
                <input
                  aria-label="Category"
                  className={field}
                  value={newAnimal.category}
                  onChange={(e) => setNewAnimal({ ...newAnimal, category: e.target.value })}
                />
                <button
                  type="button"
                  className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
                  onClick={() => {
                    if (!newAnimal.name.trim()) return;
                    update((d) => ({
                      ...d,
                      animals: [...d.animals, { id: `a-${Date.now()}`, ...newAnimal }],
                    }));
                    setNewAnimal({ name: "", emoji: "🐾", category: "OTHER WILDLIFE" });
                  }}
                >
                  Add animal
                </button>
              </div>
              {data.animals.map((a) => (
                <div key={a.id} className={`${card} flex items-center gap-3`}>
                  <span className="text-2xl">{a.emoji}</span>
                  <span className="flex-1 font-semibold text-ink">{a.name}</span>
                  <span className="text-sm text-muted-foreground">{a.category}</span>
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-1 text-sm text-destructive"
                    onClick={() =>
                      update((d) => ({ ...d, animals: d.animals.filter((x) => x.id !== a.id) }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </>
          ) : null}

          {tab === "locations" ? (
            <>
              {data.locations.map((l) => (
                <div key={l.id} className={`${card} space-y-3`}>
                  <input
                    aria-label="Location name"
                    className={field}
                    value={l.name}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        locations: d.locations.map((x) =>
                          x.id === l.id ? { ...x, name: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                  <textarea
                    aria-label="Location description"
                    rows={2}
                    className={field}
                    value={l.description}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        locations: d.locations.map((x) =>
                          x.id === l.id ? { ...x, description: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </>
          ) : null}

          {tab === "guests" ? (
            <>
              {data.guests.map((g) => (
                <div key={g.id} className={`${card} flex items-center justify-between`}>
                  <span className="font-semibold text-ink">{g.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {data.memories.filter((m) => m.guestId === g.id).length} memories
                    {g.isMe ? " · this device" : ""}
                  </span>
                </div>
              ))}
            </>
          ) : null}

          {tab === "activity" ? (
            <>
              <h2 className="text-lg font-bold text-ink">Guest activity</h2>
              {data.guests.map((g) => {
                const visits = data.visits.filter((v) => v.guestId === g.id);
                const sorted = [...visits].sort(
                  (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
                );
                const first = sorted[0];
                const last = sorted[sorted.length - 1];
                return (
                  <div key={g.id} className={`${card} space-y-1`}>
                    <p className="font-semibold text-ink">{g.name}</p>
                    <p className="text-sm text-muted-foreground">{visits.length} visits</p>
                    <p className="text-sm text-muted-foreground">
                      Last access:{" "}
                      {last ? new Date(last.startedAt).toLocaleString("en-GB") : "No visits yet"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      First access:{" "}
                      {first ? new Date(first.startedAt).toLocaleString("en-GB") : "—"}
                    </p>
                    {visits.some((v) => !v.synced) ? (
                      <p className="text-sm font-semibold text-primary">
                        Some visits recorded offline, waiting to sync
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </>
          ) : null}

          {tab === "guide" ? (
            <>
              <h2 className="text-lg font-bold text-ink">Guides</h2>
              {data.guides.map((g) => (
                <div key={g.id} className={`${card} space-y-3`}>
                  {(["name", "role", "experience", "phone", "whatsapp"] as const).map((key) => (
                    <div key={key}>
                      <label
                        className="text-sm font-semibold text-muted-foreground capitalize"
                        htmlFor={`${g.id}-${key}`}
                      >
                        {key === "whatsapp" ? "WhatsApp number" : key}
                      </label>
                      <input
                        id={`${g.id}-${key}`}
                        className={field}
                        value={g[key]}
                        onChange={(e) => saveGuide(g.id, { [key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div>
                    <label
                      className="text-sm font-semibold text-muted-foreground"
                      htmlFor={`${g.id}-about`}
                    >
                      Short biography
                    </label>
                    <textarea
                      id={`${g.id}-about`}
                      rows={3}
                      className={field}
                      value={g.about}
                      onChange={(e) => saveGuide(g.id, { about: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {g.photo ? (
                      <img
                        src={resolveImage(g.photo)}
                        alt={g.name}
                        className="size-16 rounded-lg object-cover"
                      />
                    ) : null}
                    <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground uppercase">
                      Upload image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          saveGuide(g.id, { photo: await compressImage(file) });
                        }}
                      />
                    </label>
                  </div>
                  {confirmDeleteGuide === g.id ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-ink">Delete this guide?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-border px-3 py-2 text-sm font-semibold uppercase"
                          onClick={() => setConfirmDeleteGuide(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground uppercase"
                          onClick={() => {
                            deleteGuide(g.id);
                            setConfirmDeleteGuide(null);
                          }}
                        >
                          Delete guide
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-destructive uppercase"
                      onClick={() => setConfirmDeleteGuide(g.id)}
                    >
                      Delete guide
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground uppercase"
                onClick={() => addGuide()}
              >
                + Add guide
              </button>

              <h2 className="pt-6 text-lg font-bold text-ink">Drivers</h2>
              {data.drivers.map((dr) => (
                <div key={dr.id} className={`${card} space-y-3`}>
                  {(["name", "role", "phone", "whatsapp"] as const).map((key) => (
                    <div key={key}>
                      <label
                        className="text-sm font-semibold text-muted-foreground capitalize"
                        htmlFor={`${dr.id}-${key}`}
                      >
                        {key === "whatsapp" ? "WhatsApp number" : key}
                      </label>
                      <input
                        id={`${dr.id}-${key}`}
                        className={field}
                        value={dr[key]}
                        onChange={(e) => saveDriver(dr.id, { [key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div>
                    <label
                      className="text-sm font-semibold text-muted-foreground"
                      htmlFor={`${dr.id}-about`}
                    >
                      Short biography
                    </label>
                    <textarea
                      id={`${dr.id}-about`}
                      rows={2}
                      className={field}
                      value={dr.about}
                      onChange={(e) => saveDriver(dr.id, { about: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {dr.photo ? (
                      <img
                        src={resolveImage(dr.photo)}
                        alt={dr.name}
                        className="size-16 rounded-lg object-cover"
                      />
                    ) : null}
                    <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground uppercase">
                      Upload image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          saveDriver(dr.id, { photo: await compressImage(file) });
                        }}
                      />
                    </label>
                  </div>
                  {confirmDeleteDriver === dr.id ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-ink">Delete this driver?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-border px-3 py-2 text-sm font-semibold uppercase"
                          onClick={() => setConfirmDeleteDriver(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground uppercase"
                          onClick={() => {
                            deleteDriver(dr.id);
                            setConfirmDeleteDriver(null);
                          }}
                        >
                          Delete driver
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-destructive uppercase"
                      onClick={() => setConfirmDeleteDriver(dr.id)}
                    >
                      Delete driver
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground uppercase"
                onClick={() => addDriver()}
              >
                + Add driver
              </button>
            </>
          ) : null}
        </div>

        <p className="py-10 text-center text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Powered by Tapp
        </p>
      </div>
    </div>
  );
}