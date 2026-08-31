import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useRef, useState } from "react";

import { AppShell, BrandHeader, ConnectionStatus, PoweredByTapp } from "@/components/journey/AppShell";
import { BackButton } from "@/components/journey/BackButton";
import { BigButton, BigLink } from "@/components/journey/BigButton";
import { compressImage } from "@/lib/journey/images";
import { uploadMemory } from "@/lib/journey/memories";
import { useJourney } from "@/lib/journey/journey-context";

export const Route = createFileRoute("/add-memory")({
  validateSearch: (search: Record<string, unknown>) => ({
    animal: typeof search["animal"] === "string" ? (search["animal"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Add a Memory — Windsong Travel Africa 2026" },
      { name: "description", content: "Take or choose a photograph, add where you were, and save it to the group album." },
      { property: "og:title", content: "Add a Memory — Windsong Travel Africa 2026" },
      { property: "og:description", content: "Save a photograph and a few words to your journey." },
    ],
  }),
  component: AddMemory,
});

function AddMemory() {
  const { animal } = useSearch({ from: "/add-memory" });
  const { data, addMemory, online, updateSighting } = useJourney();
  const navigate = useNavigate();

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);

  const animalRecord = data.animals.find((a) => a.id === animal);

  const onFile = async (file?: File) => {
    if (!file) return;
    setFile(file);
    setUploadError(null);
    setPhoto(await compressImage(file));
  };

  const useMyLocation = () => {
    const nearest = data.locations.find((l) => l.status === "upcoming") ?? data.locations[0];
    if (!navigator.geolocation) {
      if (nearest) {
        setLocationId(nearest.id);
        setLocationName(nearest.name);
      }
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        let best = data.locations[0];
        let bestDist = Number.POSITIVE_INFINITY;
        for (const l of data.locations) {
          const d = (l.lat - pos.coords.latitude) ** 2 + (l.lng - pos.coords.longitude) ** 2;
          if (d < bestDist) {
            bestDist = d;
            best = l;
          }
        }
        if (best) {
          setLocationId(best.id);
          setLocationName(best.name);
        }
      },
      () => {
        if (nearest) {
          setLocationId(nearest.id);
          setLocationName(nearest.name);
        }
      },
    );
  };

  const save = async () => {
    if (!photo || uploading) return;
    const chosen = data.locations.find((l) => l.id === locationId);
    const caption = description.trim();

    if (file) {
      setUploading(true);
      setUploadError(null);
      try {
        await uploadMemory(file, caption);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[add-memory] save failed", err);
        setUploadError(message);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    addMemory({
      photo,
      description: caption || "A moment from our journey.",
      locationId: chosen?.id ?? null,
      locationName: chosen?.name ?? locationName.trim() ?? "",
      ...(animalRecord ? { animalId: animalRecord.id } : {}),
    });
    if (animalRecord) {
      updateSighting(animalRecord.id, {
        photo,
        note: caption,
        locationName: chosen?.name ?? locationName.trim(),
      });
    }
    setSavedOffline(!online);
    setSaved(true);
  };

  if (saved) {
    return (
      <AppShell>
        <BrandHeader />
      <BackButton />
        <div className="px-6 pt-16 text-center">
          <p className="text-7xl">✓</p>
          <h1 className="font-display mt-4 text-4xl font-semibold text-ink">Memory saved</h1>
          <p className="mt-4 text-xl leading-relaxed text-muted-foreground">
            {savedOffline
              ? "You're offline. Your memory is safely saved on this phone and will upload when you're connected."
              : "Thank you — it is now in our group album."}
          </p>
          <BigLink to="/memories" className="mt-8">
            See our memories
          </BigLink>
          <BigLink to="/home" variant="soft" className="mt-3">
            Back to home
          </BigLink>
        </div>
        <PoweredByTapp />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <BrandHeader />
      <BackButton />
      <ConnectionStatus />

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <header className="px-6 pt-6">
        <h1 className="font-display text-4xl font-semibold text-ink">Add memory</h1>
        {animalRecord ? (
          <p className="mt-2 text-lg text-muted-foreground">
            {animalRecord.emoji} A photo of your {animalRecord.name.toLowerCase()} sighting
          </p>
        ) : null}
      </header>

      {!photo ? (
        <div className="mt-8 space-y-4 px-6">
          <p className="text-xl text-foreground">What would you like to do?</p>
          <BigButton className="min-h-20" onClick={() => cameraRef.current?.click()}>
            📷 Take a photo
          </BigButton>
          <BigButton variant="soft" className="min-h-20" onClick={() => galleryRef.current?.click()}>
            🖼️ Choose a photo
          </BigButton>
        </div>
      ) : (
        <div className="mt-6 space-y-6 px-6">
          <img src={photo} alt="Your memory" className="w-full rounded-3xl object-cover" />
          <BigButton
            variant="soft"
            onClick={() => {
              setPhoto(null);
              setFile(null);
              setUploadError(null);
            }}
          >
            Choose a different photo
          </BigButton>

          <div>
            <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase">Where was this?</h2>
            <BigButton className="mt-3" variant="outline" onClick={useMyLocation}>
              📍 Use my location
            </BigButton>
            <p className="mt-4 text-lg text-foreground">Or choose a place</p>
            <div className="mt-3 space-y-3">
              {data.locations.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setLocationId(l.id);
                    setLocationName(l.name);
                  }}
                  className={`flex min-h-16 w-full items-center rounded-3xl px-6 text-left text-lg font-bold ${
                    locationId === l.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  📍 {l.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase">
              Tell us about this memory
            </h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What would you like to remember?"
              aria-label="Tell us about this memory"
              className="mt-3 w-full rounded-3xl border-2 border-input bg-card p-5 text-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {uploadError ? (
            <p className="text-lg leading-relaxed text-destructive">{uploadError}</p>
          ) : null}

          <BigButton className="min-h-20" onClick={save} disabled={uploading}>
            {uploading ? "Saving…" : "Save memory"}
          </BigButton>
          <BigButton variant="soft" onClick={() => navigate({ to: "/home" })}>
            Cancel
          </BigButton>
        </div>
      )}

      <PoweredByTapp />
    </AppShell>
  );
}