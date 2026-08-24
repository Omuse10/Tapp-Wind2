import { supabase } from "@/integrations/supabase/client";

export type Journey = {
  id: string;
  name: string;
  slug: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
};

export type ItineraryItem = {
  id: string;
  day_id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  sort_order: number | null;
};

export type ItineraryDay = {
  id: string;
  journey_id: string;
  day_number: number | null;
  date: string | null;
  title: string | null;
  description: string | null;
};

const JOURNEY_COLS = "id, name, slug, destination, start_date, end_date, status";
const DAY_COLS = "id, journey_id, day_number, date, title, description";
const ITEM_COLS = "id, day_id, title, description, location, start_time, end_time, sort_order";

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
}

export async function listJourneys(): Promise<Journey[]> {
  return unwrap<Journey[]>(
    await supabase.from("journeys").select(JOURNEY_COLS).order("start_date", { ascending: true }),
  );
}

export async function listDays(journeyId: string): Promise<ItineraryDay[]> {
  return unwrap<ItineraryDay[]>(
    await supabase
      .from("itinerary_days")
      .select(DAY_COLS)
      .eq("journey_id", journeyId)
      .order("day_number", { ascending: true }),
  );
}

export async function listItems(dayIds: string[]): Promise<ItineraryItem[]> {
  if (dayIds.length === 0) return [];
  return unwrap<ItineraryItem[]>(
    await supabase
      .from("itinerary_items")
      .select(ITEM_COLS)
      .in("day_id", dayIds)
      .order("sort_order", { ascending: true }),
  );
}

/** Full staff view of one journey: journey + its days + all their items. */
export async function loadJourneyTree(journeyId: string) {
  const days = await listDays(journeyId);
  const items = await listItems(days.map((d) => d.id));
  return { days, items };
}

export async function updateJourney(id: string, patch: Partial<Journey>) {
  const { error } = await supabase.from("journeys").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateDay(id: string, patch: Partial<ItineraryDay>) {
  const { error } = await supabase.from("itinerary_days").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertDay(journeyId: string, dayNumber: number) {
  const { error } = await supabase
    .from("itinerary_days")
    .insert({ journey_id: journeyId, day_number: dayNumber, title: "New day" });
  if (error) throw new Error(error.message);
}

export async function deleteDay(id: string) {
  const { error } = await supabase.from("itinerary_days").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateItem(id: string, patch: Partial<ItineraryItem>) {
  const { error } = await supabase.from("itinerary_items").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertItem(dayId: string, sortOrder: number) {
  const { error } = await supabase
    .from("itinerary_items")
    .insert({ day_id: dayId, title: "New activity", sort_order: sortOrder });
  if (error) throw new Error(error.message);
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from("itinerary_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
