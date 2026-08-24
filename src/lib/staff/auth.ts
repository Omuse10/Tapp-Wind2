import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type StaffUser = {
  id: string;
  email: string;
  role: string;
};

export type StaffState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "unauthorized"; email: string | null }
  | { status: "staff"; staff: StaffUser };

/** Reads the staff_users row for the signed-in user. RLS only exposes their own row. */
export async function fetchStaffProfile(userId: string): Promise<StaffUser | null> {
  const { data, error } = await supabase
    .from("staff_users")
    .select("id, email, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[staff] staff_users lookup failed", error);
    return null;
  }
  return (data as StaffUser | null) ?? null;
}

export function useStaffSession(): StaffState {
  const [state, setState] = useState<StaffState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    const resolve = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!active) return;
      if (!user) {
        setState({ status: "signed-out" });
        return;
      }
      const staff = await fetchStaffProfile(user.id);
      if (!active) return;
      setState(staff ? { status: "staff", staff } : { status: "unauthorized", email: user.email ?? null });
    };

    void resolve();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void resolve();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signInStaff(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(error.message);
  const user = data.user;
  if (!user) throw new Error("Sign in failed — please try again.");
  const staff = await fetchStaffProfile(user.id);
  if (!staff) {
    await supabase.auth.signOut();
    throw new Error("This account is not authorised for the Windsong staff area.");
  }
  return staff;
}

export async function signOutStaff() {
  await supabase.auth.signOut();
}
