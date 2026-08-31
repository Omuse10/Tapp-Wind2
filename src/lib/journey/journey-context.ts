import { createContext, useContext, useEffect, useState } from "react";

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
} from "./types";

export const UPDATE_LIFETIME_MS = 12 * 60 * 60 * 1000;

export function isUpdateLive(u: DailyUpdate, now = Date.now()) {
  return new Date(u.expiresAt).getTime() > now;
}

export interface JourneyContextValue {
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
  sendGroupMessage: (text: string) => void;
  addGuide: () => Guide;
  saveGuide: (id: string, patch: Partial<Guide>) => void;
  deleteGuide: (id: string) => void;
  addDriver: () => Driver;
  saveDriver: (id: string, patch: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  update: (fn: (draft: JourneyData) => JourneyData) => void;
  resetAll: () => void;
}

export const JourneyContext = createContext<JourneyContextValue | null>(null);

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
