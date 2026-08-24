import { supabase } from "@/integrations/supabase/client";

export type VisitorSession = {
  id: string;
  name: string;
  sessionToken: string | null;
  journeyId: string;
  journeySlug: string;
};

const key = (slug: string) => `windsong-visitor-${slug}`;

export function loadVisitor(slug: string): VisitorSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key(slug));
    return raw ? (JSON.parse(raw) as VisitorSession) : null;
  } catch {
    return null;
  }
}

export function saveVisitor(session: VisitorSession) {
  try {
    window.sessionStorage.setItem(key(session.journeySlug), JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

/** Find any visitor session stored in this browser session (any journey slug). */
export function loadAnyVisitor(): VisitorSession | null {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const k = window.sessionStorage.key(i);
      if (!k || !k.startsWith("windsong-visitor-")) continue;
      const raw = window.sessionStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as VisitorSession;
      if (parsed?.id && parsed?.journeyId) return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Always creates a NEW visitor row — names are not identifiers. */
export async function createVisitor(journeyId: string, name: string, slug: string) {
  type VisitorRow = {
    id: string;
    journey_id: string;
    name: string;
    session_token: string | null;
    created_at: string;
  };
  const trimmed = name.trim();
  const { data, error } = await supabase.rpc("create_visitor", {
    p_journey_id: journeyId,
    p_name: trimmed,
  });
  // Surface the raw RPC outcome so failures are never silent.
  console.info("[create_visitor] response", { data, error });
  if (error) {
    console.error("[create_visitor] failed", error);
    throw new Error(error.message || "create_visitor failed");
  }
  const row = (Array.isArray(data) ? data[0] : data) as VisitorRow | undefined;
  if (!row?.id) throw new Error("create_visitor returned no visitor row.");
  const session: VisitorSession = {
    id: row.id,
    name: row.name ?? trimmed,
    sessionToken: row.session_token ?? null,
    journeyId: row.journey_id ?? journeyId,
    journeySlug: slug,
  };
  saveVisitor(session);
  return session;
}
