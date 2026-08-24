import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  deleteDay,
  deleteItem,
  insertDay,
  insertItem,
  listJourneys,
  loadJourneyTree,
  updateDay,
  updateItem,
  updateJourney,
  type ItineraryDay,
  type ItineraryItem,
  type Journey,
} from "@/lib/staff/journeys";

const field =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground focus:border-primary focus:outline-none";
const card = "rounded-lg border border-border bg-card p-4";
const primaryBtn =
  "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground uppercase disabled:opacity-50";
const ghostBtn = "rounded-lg border border-border px-3 py-2 text-sm font-semibold uppercase";

type Status = { kind: "idle" | "saving" | "saved" | "error"; message?: string };

function StatusLine({ status }: { status: Status }) {
  if (status.kind === "saving") return <p className="text-sm text-muted-foreground">Saving…</p>;
  if (status.kind === "saved") return <p className="text-sm font-semibold text-primary">Saved to Supabase</p>;
  if (status.kind === "error")
    return <p className="text-sm font-semibold text-destructive">{status.message}</p>;
  return null;
}

/** Runs a Supabase mutation, only reporting success once the database confirms it. */
function useMutate(onDone: () => Promise<unknown>) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const run = async (fn: () => Promise<void>) => {
    setStatus({ kind: "saving" });
    try {
      await fn();
      await onDone();
      setStatus({ kind: "saved" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[staff] Supabase write failed", err);
      setStatus({ kind: "error", message });
    }
  };
  return { status, run, busy: status.kind === "saving" };
}

function JourneyEditor({ journey, refresh }: { journey: Journey; refresh: () => Promise<unknown> }) {
  const [draft, setDraft] = useState(journey);
  useEffect(() => setDraft(journey), [journey]);
  const { status, run, busy } = useMutate(refresh);

  return (
    <div className={`${card} space-y-3`}>
      <h3 className="text-lg font-bold text-ink">Journey details</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-muted-foreground">
          Name
          <input
            className={field}
            value={draft.name ?? ""}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label className="block text-sm font-semibold text-muted-foreground">
          Destination
          <input
            className={field}
            value={draft.destination ?? ""}
            onChange={(e) => setDraft({ ...draft, destination: e.target.value })}
          />
        </label>
        <label className="block text-sm font-semibold text-muted-foreground">
          Start date
          <input
            type="date"
            className={field}
            value={draft.start_date ?? ""}
            onChange={(e) => setDraft({ ...draft, start_date: e.target.value || null })}
          />
        </label>
        <label className="block text-sm font-semibold text-muted-foreground">
          End date
          <input
            type="date"
            className={field}
            value={draft.end_date ?? ""}
            onChange={(e) => setDraft({ ...draft, end_date: e.target.value || null })}
          />
        </label>
        <label className="block text-sm font-semibold text-muted-foreground">
          Status
          <input
            className={field}
            value={draft.status ?? ""}
            onChange={(e) => setDraft({ ...draft, status: e.target.value || null })}
          />
        </label>
        <p className="self-end text-sm text-muted-foreground">
          Public link: <code>/j/{journey.slug}</code>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={busy}
          className={primaryBtn}
          onClick={() =>
            void run(() =>
              updateJourney(journey.id, {
                name: draft.name,
                destination: draft.destination,
                start_date: draft.start_date,
                end_date: draft.end_date,
                status: draft.status,
              }),
            )
          }
        >
          Save journey
        </button>
        <StatusLine status={status} />
      </div>
    </div>
  );
}

function ItemEditor({ item, refresh }: { item: ItineraryItem; refresh: () => Promise<unknown> }) {
  const [draft, setDraft] = useState(item);
  useEffect(() => setDraft(item), [item]);
  const { status, run, busy } = useMutate(refresh);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-2 rounded-lg border border-border bg-background p-3">
      <div className="grid gap-2 sm:grid-cols-4">
        <input
          aria-label="Start time"
          type="time"
          className={field}
          value={(draft.start_time ?? "").slice(0, 5)}
          onChange={(e) => setDraft({ ...draft, start_time: e.target.value || null })}
        />
        <input
          aria-label="End time"
          type="time"
          className={field}
          value={(draft.end_time ?? "").slice(0, 5)}
          onChange={(e) => setDraft({ ...draft, end_time: e.target.value || null })}
        />
        <input
          aria-label="Activity title"
          className={field}
          value={draft.title ?? ""}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <input
          aria-label="Location"
          className={field}
          placeholder="Location"
          value={draft.location ?? ""}
          onChange={(e) => setDraft({ ...draft, location: e.target.value })}
        />
      </div>
      <textarea
        aria-label="Activity description"
        rows={2}
        className={field}
        value={draft.description ?? ""}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          aria-label="Sort order"
          type="number"
          className={`${field} w-24`}
          value={draft.sort_order ?? 0}
          onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
        />
        <button
          type="button"
          disabled={busy}
          className={primaryBtn}
          onClick={() =>
            void run(() =>
              updateItem(item.id, {
                title: draft.title,
                description: draft.description,
                location: draft.location,
                start_time: draft.start_time,
                end_time: draft.end_time,
                sort_order: draft.sort_order,
              }),
            )
          }
        >
          Save item
        </button>
        {confirmDelete ? (
          <>
            <button type="button" className={ghostBtn} onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground uppercase"
              onClick={() => void run(() => deleteItem(item.id))}
            >
              Confirm delete
            </button>
          </>
        ) : (
          <button
            type="button"
            className={`${ghostBtn} text-destructive`}
            onClick={() => setConfirmDelete(true)}
          >
            Delete item
          </button>
        )}
        <StatusLine status={status} />
      </div>
    </div>
  );
}

function DayEditor({
  day,
  items,
  refresh,
}: {
  day: ItineraryDay;
  items: ItineraryItem[];
  refresh: () => Promise<unknown>;
}) {
  const [draft, setDraft] = useState(day);
  useEffect(() => setDraft(day), [day]);
  const { status, run, busy } = useMutate(refresh);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`${card} space-y-3`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm font-semibold text-muted-foreground">
          Day number
          <input
            type="number"
            className={field}
            value={draft.day_number ?? 0}
            onChange={(e) => setDraft({ ...draft, day_number: Number(e.target.value) })}
          />
        </label>
        <label className="block text-sm font-semibold text-muted-foreground">
          Date
          <input
            type="date"
            className={field}
            value={draft.date ?? ""}
            onChange={(e) => setDraft({ ...draft, date: e.target.value || null })}
          />
        </label>
        <label className="block text-sm font-semibold text-muted-foreground">
          Title
          <input
            className={field}
            value={draft.title ?? ""}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
      </div>
      <textarea
        aria-label="Day description"
        rows={2}
        className={field}
        value={draft.description ?? ""}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          className={primaryBtn}
          onClick={() =>
            void run(() =>
              updateDay(day.id, {
                day_number: draft.day_number,
                date: draft.date,
                title: draft.title,
                description: draft.description,
              }),
            )
          }
        >
          Save day
        </button>
        {confirmDelete ? (
          <>
            <button type="button" className={ghostBtn} onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground uppercase"
              onClick={() => void run(() => deleteDay(day.id))}
            >
              Confirm delete day
            </button>
          </>
        ) : (
          <button
            type="button"
            className={`${ghostBtn} text-destructive`}
            onClick={() => setConfirmDelete(true)}
          >
            Delete day
          </button>
        )}
        <StatusLine status={status} />
      </div>

      <div className="space-y-2 pt-2">
        {items.map((item) => (
          <ItemEditor key={item.id} item={item} refresh={refresh} />
        ))}
        <button
          type="button"
          className={ghostBtn}
          onClick={() =>
            void run(() =>
              insertItem(day.id, items.length ? Math.max(...items.map((i) => i.sort_order ?? 0)) + 1 : 1),
            )
          }
        >
          + Add item
        </button>
      </div>
    </div>
  );
}

export function StaffItinerary() {
  const queryClient = useQueryClient();
  const journeysQuery = useQuery({ queryKey: ["staff", "journeys"], queryFn: listJourneys });
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const activeId = journeyId ?? journeysQuery.data?.[0]?.id ?? null;

  const treeQuery = useQuery({
    queryKey: ["staff", "journey-tree", activeId],
    queryFn: () => loadJourneyTree(activeId as string),
    enabled: Boolean(activeId),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["staff"] });
    await queryClient.invalidateQueries({ queryKey: ["journey"] });
  };

  const { status, run, busy } = useMutate(refresh);

  if (journeysQuery.isLoading) return <p className="text-muted-foreground">Loading journeys…</p>;
  if (journeysQuery.error)
    return (
      <p className="font-semibold text-destructive">
        {(journeysQuery.error as Error).message}
      </p>
    );

  const journeys = journeysQuery.data ?? [];
  const journey = journeys.find((j) => j.id === activeId) ?? null;
  const days = treeQuery.data?.days ?? [];
  const items = treeQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className={`${card} space-y-2`}>
        <label className="block text-sm font-semibold text-muted-foreground" htmlFor="journey-pick">
          Journey (live from Supabase)
        </label>
        <select
          id="journey-pick"
          className={field}
          value={activeId ?? ""}
          onChange={(e) => setJourneyId(e.target.value)}
        >
          {journeys.map((j) => (
            <option key={j.id} value={j.id}>
              {j.name}
            </option>
          ))}
        </select>
      </div>

      {journey ? <JourneyEditor journey={journey} refresh={refresh} /> : null}

      {treeQuery.isLoading ? <p className="text-muted-foreground">Loading itinerary…</p> : null}
      {treeQuery.error ? (
        <p className="font-semibold text-destructive">{(treeQuery.error as Error).message}</p>
      ) : null}

      {days.map((day) => (
        <DayEditor
          key={day.id}
          day={day}
          items={items.filter((i) => i.day_id === day.id)}
          refresh={refresh}
        />
      ))}

      {journey && !treeQuery.isLoading && days.length === 0 ? (
        <p className="text-muted-foreground">This journey has no itinerary days yet.</p>
      ) : null}

      {journey ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={busy}
            className={primaryBtn}
            onClick={() =>
              void run(() =>
                insertDay(journey.id, days.length ? Math.max(...days.map((d) => d.day_number ?? 0)) + 1 : 1),
              )
            }
          >
            + Add day
          </button>
          <StatusLine status={status} />
        </div>
      ) : null}
    </div>
  );
}
