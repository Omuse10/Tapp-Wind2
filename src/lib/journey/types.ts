// Data model for the Windsong Journey prototype.
// Shapes mirror future Supabase tables so the UI never needs redesigning.

export type ID = string;

export interface Trip {
  id: ID;
  name: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface LocationRecord {
  id: ID;
  tripId: ID;
  name: string;
  shortName: string;
  description: string;
  lat: number;
  lng: number;
  order: number;
  status: "visited" | "upcoming";
  imageKey?: string | undefined;
}

export interface ItineraryDay {
  id: ID;
  tripId: ID;
  date: string; // yyyy-mm-dd
  title: string;
  note: string;
}

export interface ItineraryItem {
  id: ID;
  dayId: ID;
  time: string;
  title: string;
  emoji: string;
  locationId: ID;
}

export interface Guest {
  id: ID;
  tripId: ID;
  name: string;
  isMe?: boolean | undefined;
}

export interface Memory {
  id: ID;
  tripId: ID;
  guestId: ID;
  guestName: string;
  locationId: ID | null;
  locationName: string;
  description: string;
  photo: string; // data URL or bundled asset URL
  createdAt: string;
  pending?: boolean | undefined;
  animalId?: ID | undefined;
}

export interface Comment {
  id: ID;
  memoryId: ID;
  guestName: string;
  text: string;
  createdAt: string;
}

export interface Like {
  memoryId: ID;
  guestId: ID;
}

export interface Animal {
  id: ID;
  name: string;
  emoji: string;
  category: string;
}

export interface AnimalSighting {
  animalId: ID;
  guestId: ID;
  note?: string | undefined;
  photo?: string | undefined;
  seenAt: string;
  locationName?: string | undefined;
}

export interface DailyWord {
  id: ID;
  date: string;
  word: string;
  meaning: string;
  pronunciation: string;
}

export interface Guide {
  id: ID;
  tripId: ID;
  name: string;
  role: string;
  experience: string;
  phone: string;
  whatsapp: string;
  about: string;
  photo?: string | undefined;
}

export interface Driver {
  id: ID;
  tripId: ID;
  name: string;
  role: string;
  phone: string;
  whatsapp: string;
  about: string;
  photo?: string | undefined;
}

/** A short message published by Windsong staff; expires ~12 hours later. */
export interface DailyUpdate {
  id: ID;
  tripId: ID;
  title: string;
  message: string;
  publishedAt: string;
  expiresAt: string;
}

export interface GroupMessage {
  id: ID;
  tripId: ID;
  guestId: ID;
  guestName: string;
  text: string;
  createdAt: string;
}

/** One pending change waiting to reach the backend when a signal returns. */
export interface SyncOp {
  id: ID;
  kind:
    | "memory.create"
    | "memory.update"
    | "memory.delete"
    | "visit.record";
  entityId: ID;
  createdAt: string;
}

/** A meaningful app session, not a page view. */
export interface VisitSession {
  id: ID;
  guestId: ID;
  guestName: string;
  startedAt: string;
  synced?: boolean | undefined;
}

export interface JourneyData {
  trip: Trip;
  locations: LocationRecord[];
  days: ItineraryDay[];
  items: ItineraryItem[];
  guests: Guest[];
  memories: Memory[];
  comments: Comment[];
  likes: Like[];
  animals: Animal[];
  sightings: AnimalSighting[];
  words: DailyWord[];
  guides: Guide[];
  drivers: Driver[];
  updates: DailyUpdate[];
  groupMessages: GroupMessage[];
  syncQueue: SyncOp[];
  visits: VisitSession[];
  meGuestId: ID | null;
}