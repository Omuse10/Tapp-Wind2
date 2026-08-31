import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { idbGet, idbSet } from "./idb";
import { seed, todayISO, TODAY_FALLBACK } from "./seed";
import type {
  Animal,
  AnimalSighting,
  Comment,
  DailyUpdate,
  DailyWord,
  Driver,
  Guest,
  Guide,
  ItineraryDay,
  ItineraryItem,
  JourneyData,
  LocationRecord,
  Memory,
  SyncOp,
} from "./types";

const STORAGE_KEY = "windsong-journey-v1";
const IDB_KEY = "journey";
const SESSION_KEY = "windsong-last-activity";
const SESSION_GAP_MS = 30 * 60 * 1000; // a new visit after half an hour away

function migrate(parsed: Partial<JourneyData> & { guide?: Guide }): JourneyData {
  const next: JourneyData = { ...seed, ...(parsed as Partial<JourneyData>) };
  if ((!parsed.guides || parsed.guides.length === 0) && parsed.guide) {
    next.guides = [parsed.guide];
  }
  next.guides = next.guides ?? seed.guides;
  next.drivers = next.drivers ?? seed.drivers;
  next.updates = next.updates && next.updates.length > 0 ? next.updates : seed.updates;
  next.syncQueue = next.syncQueue ?? [];
  next.visits = next.visits ?? [];
  return next;
}

/** Read the journey from IndexedDB, migrating older localStorage data once. */
async function loadData(): Promise<JourneyData> {
  if (typeof window === "undefined") return seed;
  const stored = await idbGet<Partial<JourneyData>>(IDB_KEY);
  if (stored) return migrate(stored);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const legacy = migrate(JSON.parse(raw) as Partial<JourneyData>);
      await idbSet(IDB_KEY, legacy);
      return legacy;
    }
  } catch {
    /* ignore unreadable legacy data */
  }
  return seed;
}

const newId = () => `x-${Math.random().toString(36).slice(2, 10)}`;

function queueOp(queue: SyncOp[], kind: SyncOp["kind"], entityId: string): SyncOp[] {
  // Keep only the newest op per entity+kind so repeated offline edits sync once.
  const rest = queue.filter((op) => !(op.entityId === entityId && op.kind === kind));
  return [...rest, { id: newId(), kind, entityId, createdAt: new Date().toISOString() }];
}

export const UPDATE_LIFETIME_MS = 12 * 60 * 60 * 1000;

export function isUpdateLive(u: DailyUpdate, now = Date.now()) {
  return new Date(u.expiresAt).getTime() > now;
}

interface JourneyContextValue {
  data: JourneyData;
  ready: boolean;
  online: boolean;
  syncing: boolean;
  pendingCount: number;
  me: Guest | null;
  today: ItineraryDay;
  todayItems: ItineraryItem[];
  wordOfTheDay: DailyWord;
  activeUpdate: DailyUpdate | null;
  setName: (name: string) => void;
  locationById: (id: string | null) => LocationRecord | undefined;
  addMemory: (input: {
    photo: string;
    description: string;
    locationId: string | null;
    locationName: string;
    animalId?: string;
  }) => Memory;
  editMemory: (
    memoryId: string,
    patch: { description?: string; locationId?: string | null; locationName?: string },
  ) => void;
  deleteMemory: (memoryId: string) => void;
  toggleLike: (memoryId: string) => void;
  likeCount: (memoryId: string) => number;
  hasLiked: (memoryId: string) => boolean;
  commentsFor: (memoryId: string) => Comment[];
  addComment: (memoryId: string, text: string) => void;
  memoriesForLocation: (locationId: string) => Memory[];
  memoriesForGuest: (guestId: string) => Memory[];
  sightingFor: (animalId: string) => AnimalSighting | undefined;
  markAnimalSeen: (animal: Animal) => void;
  unmarkAnimal: (animalId: string) => void;
  updateSighting: (animalId: string, patch: Partial<AnimalSighting>) => void;
  publishUpdate: (input: { title: string; message: string; id?: string }) => void;
  deleteUpdate: (id: string) => void;
  addGuide: () => Guide;
  saveGuide: (id: string, patch: Partial<Guide>) => void;
  deleteGuide: (id: string) => void;
  addDriver: () => Driver;
  saveDriver: (id: string, patch: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  update: (fn: (draft: JourneyData) => JourneyData) => void;
  resetAll: () => void;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<JourneyData>(seed);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const now = useCurrentDate();
  const visitLogged = useRef(false);

  const update = useCallback((fn: (draft: JourneyData) => JourneyData) => {
    setData((prev) => {
      const next = fn(prev);
      void idbSet(IDB_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadData().then((loaded) => {
      if (cancelled) return;
      setData(loaded);
      setReady(true);
    });
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      cancelled = true;
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Record a visit (a real session, not a refresh or a page view). Works offline.
  useEffect(() => {
    if (!ready || visitLogged.current) return;
    visitLogged.current = true;
    let last = 0;
    try {
      last = Number(window.sessionStorage.getItem(SESSION_KEY) ?? 0);
      if (!last) last = Number(window.localStorage.getItem(SESSION_KEY) ?? 0);
    } catch {
      /* ignore */
    }
    const now = Date.now();
    const touch = () => {
      try {
        window.sessionStorage.setItem(SESSION_KEY, String(Date.now()));
        window.localStorage.setItem(SESSION_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    };
    const isNewSession = !last || now - last > SESSION_GAP_MS;
    touch();
    const timer = window.setInterval(touch, 60_000);
    if (isNewSession) {
      update((d) => {
        const guestId = d.meGuestId;
        if (!guestId) return d;
        const guest = d.guests.find((g) => g.id === guestId);
        const visit = {
          id: newId(),
          guestId,
          guestName: guest?.name ?? "Guest",
          startedAt: new Date().toISOString(),
          synced: false,
        };
        return {
          ...d,
          visits: [...d.visits, visit],
          syncQueue: queueOp(d.syncQueue, "visit.record", visit.id),
        };
      });
    }
    return () => window.clearInterval(timer);
  }, [ready, update]);

  // Flush everything saved offline once a signal returns — no Sync button needed.
  useEffect(() => {
    if (!ready || !online) return;
    if (data.syncQueue.length === 0 && !data.memories.some((m) => m.pending)) return;
    setSyncing(true);
    const t = setTimeout(() => {
      update((d) => ({
        ...d,
        memories: d.memories.map((m) => (m.pending ? { ...m, pending: false } : m)),
        visits: d.visits.map((v) => (v.synced ? v : { ...v, synced: true })),
        syncQueue: [],
      }));
      setSyncing(false);
    }, 1800);
    return () => clearTimeout(t);
  }, [ready, online, data.syncQueue, data.memories, update]);

  const me = useMemo(
    () => data.guests.find((g) => g.id === data.meGuestId) ?? null,
    [data.guests, data.meGuestId],
  );

  const today = useMemo(() => {
    const iso = todayISO(now);
    return (
      data.days.find((d) => d.date === iso) ??
      data.days.find((d) => d.date === TODAY_FALLBACK) ??
      (data.days[0] as ItineraryDay)
    );
  }, [data.days, now]);

  const todayItems = useMemo(
    () => data.items.filter((i) => i.dayId === today?.id),
    [data.items, today],
  );

  const wordOfTheDay = useMemo(() => {
    const iso = todayISO(now);
    const match = data.words.find((w) => w.date === iso);
    if (match) return match;
    return (data.words.find((w) => w.date === TODAY_FALLBACK) ?? data.words[0]) as DailyWord;
  }, [data.words, now]);

  const activeUpdate = useMemo(() => {
    if (!ready) return null;
    const live = data.updates
      .filter((u) => isUpdateLive(u))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    return live[0] ?? null;
  }, [data.updates, ready]);

  const pendingCount = useMemo(
    () => data.memories.filter((m) => m.pending).length,
    [data.memories],
  );

  const value: JourneyContextValue = {
    data,
    ready,
    online,
    syncing,
    pendingCount,
    me,
    today,
    todayItems,
    wordOfTheDay,
    activeUpdate,
    update,
    setName: (name) =>
      update((d) => {
        const existing = d.guests.find((g) => g.isMe);
        if (existing) {
          return {
            ...d,
            guests: d.guests.map((g) => (g.isMe ? { ...g, name } : g)),
            meGuestId: existing.id,
          };
        }
        const guest: Guest = { id: newId(), tripId: d.trip.id, name, isMe: true };
        return { ...d, guests: [...d.guests, guest], meGuestId: guest.id };
      }),
    locationById: (id) => data.locations.find((l) => l.id === id),
    addMemory: ({ photo, description, locationId, locationName, animalId }) => {
      const memory: Memory = {
        id: newId(),
        tripId: data.trip.id,
        guestId: data.meGuestId ?? "me",
        guestName: me?.name ?? "You",
        locationId,
        locationName,
        description,
        photo,
        createdAt: new Date().toISOString(),
        pending: true,
        animalId,
      };
      update((d) => ({
        ...d,
        memories: [memory, ...d.memories],
        syncQueue: queueOp(d.syncQueue, "memory.create", memory.id),
      }));
      return memory;
    },
    editMemory: (memoryId, patch) =>
      update((d) => {
        const existing = d.memories.find((m) => m.id === memoryId);
        if (!existing) return d;
        const alreadyQueuedCreate = d.syncQueue.some(
          (op) => op.kind === "memory.create" && op.entityId === memoryId,
        );
        return {
          ...d,
          memories: d.memories.map((m) => (m.id === memoryId ? { ...m, ...patch } : m)),
          // A memory that has not uploaded yet only needs its create op refreshed.
          syncQueue: alreadyQueuedCreate
            ? queueOp(d.syncQueue, "memory.create", memoryId)
            : queueOp(d.syncQueue, "memory.update", memoryId),
        };
      }),
    deleteMemory: (memoryId) =>
      update((d) => {
        const wasPending = d.syncQueue.some(
          (op) => op.kind === "memory.create" && op.entityId === memoryId,
        );
        const withoutMemoryOps = d.syncQueue.filter((op) => op.entityId !== memoryId);
        return {
          ...d,
          memories: d.memories.filter((m) => m.id !== memoryId),
          comments: d.comments.filter((c) => c.memoryId !== memoryId),
          likes: d.likes.filter((l) => l.memoryId !== memoryId),
          // Never upload something the guest already deleted.
          syncQueue: wasPending
            ? withoutMemoryOps
            : queueOp(withoutMemoryOps, "memory.delete", memoryId),
        };
      }),
    toggleLike: (memoryId) =>
      update((d) => {
        const guestId = d.meGuestId ?? "me";
        const has = d.likes.some((l) => l.memoryId === memoryId && l.guestId === guestId);
        return {
          ...d,
          likes: has
            ? d.likes.filter((l) => !(l.memoryId === memoryId && l.guestId === guestId))
            : [...d.likes, { memoryId, guestId }],
        };
      }),
    likeCount: (memoryId) => data.likes.filter((l) => l.memoryId === memoryId).length,
    hasLiked: (memoryId) =>
      data.likes.some((l) => l.memoryId === memoryId && l.guestId === (data.meGuestId ?? "me")),
    commentsFor: (memoryId) => data.comments.filter((c) => c.memoryId === memoryId),
    addComment: (memoryId, text) =>
      update((d) => ({
        ...d,
        comments: [
          ...d.comments,
          {
            id: newId(),
            memoryId,
            guestName: me?.name ?? "You",
            text,
            createdAt: new Date().toISOString(),
          },
        ],
      })),
    memoriesForLocation: (locationId) => data.memories.filter((m) => m.locationId === locationId),
    memoriesForGuest: (guestId) => data.memories.filter((m) => m.guestId === guestId),
    sightingFor: (animalId) => data.sightings.find((s) => s.animalId === animalId),
    markAnimalSeen: (animal) =>
      update((d) => ({
        ...d,
        sightings: [
          ...d.sightings.filter((s) => s.animalId !== animal.id),
          {
            animalId: animal.id,
            guestId: d.meGuestId ?? "me",
            seenAt: new Date().toISOString(),
          },
        ],
      })),
    unmarkAnimal: (animalId) =>
      update((d) => ({ ...d, sightings: d.sightings.filter((s) => s.animalId !== animalId) })),
    updateSighting: (animalId, patch) =>
      update((d) => ({
        ...d,
        sightings: d.sightings.map((s) => (s.animalId === animalId ? { ...s, ...patch } : s)),
      })),
    publishUpdate: ({ title, message, id }) =>
      update((d) => {
        const now = new Date();
        const record: DailyUpdate = {
          id: id ?? `upd-${Date.now()}`,
          tripId: d.trip.id,
          title: title.trim() || "Important update",
          message: message.trim(),
          publishedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + UPDATE_LIFETIME_MS).toISOString(),
        };
        return {
          ...d,
          updates: [...d.updates.filter((u) => u.id !== record.id), record],
        };
      }),
    deleteUpdate: (id) => update((d) => ({ ...d, updates: d.updates.filter((u) => u.id !== id) })),
    addGuide: () => {
      const guide: Guide = {
        id: `guide-${Date.now()}`,
        tripId: data.trip.id,
        name: "New guide",
        role: "Safari Guide",
        experience: "",
        phone: "",
        whatsapp: "",
        about: "",
      };
      update((d) => ({ ...d, guides: [...d.guides, guide] }));
      return guide;
    },
    saveGuide: (id, patch) =>
      update((d) => ({
        ...d,
        guides: d.guides.map((g) => (g.id === id ? { ...g, ...patch } : g)),
      })),
    deleteGuide: (id) => update((d) => ({ ...d, guides: d.guides.filter((g) => g.id !== id) })),
    addDriver: () => {
      const driver: Driver = {
        id: `driver-${Date.now()}`,
        tripId: data.trip.id,
        name: "New driver",
        role: "Safari Driver",
        phone: "",
        whatsapp: "",
        about: "",
      };
      update((d) => ({ ...d, drivers: [...d.drivers, driver] }));
      return driver;
    },
    saveDriver: (id, patch) =>
      update((d) => ({
        ...d,
        drivers: d.drivers.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      })),
    deleteDriver: (id) => update((d) => ({ ...d, drivers: d.drivers.filter((x) => x.id !== id) })),
    resetAll: () => {
      update(() => seed);
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    },
  };

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney must be used inside JourneyProvider");
  return ctx;
}

export function useCurrentDate() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const interval = window.setInterval(tick, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return now;
}

export function formatLongDateFromDate(date: Date) {
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export function formatLongDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return formatLongDateFromDate(d);
}

export function formatShortDate(isoDateTime: string) {
  const d = new Date(isoDateTime);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 18) return { text: "Good afternoon", emoji: "🌤️" };
  return { text: "Good evening", emoji: "🌙" };
}
