import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { PoweredByTapp } from "@/components/journey/AppShell";
import { signInStaff, useStaffSession } from "@/lib/staff/auth";
import logo from "@/assets/wind2-.png";

export const Route = createFileRoute("/staff-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff sign in — Windsong Travel" },
      { name: "description", content: "Sign in to the Windsong Travel staff area to manage journeys and itineraries." },
      { property: "og:title", content: "Staff sign in — Windsong Travel" },
      { property: "og:description", content: "Authorised Windsong Travel staff only." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffLogin,
});

function StaffLogin() {
  const navigate = useNavigate();
  const session = useStaffSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session.status === "staff") void navigate({ to: "/staff", replace: true });
  }, [session.status, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInStaff(email, password);
      await navigate({ to: "/staff", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-secondary/40">
      <header className="border-b border-border bg-ink px-6 py-5 text-primary-foreground">
        <img
          src={logo}
          alt="Windsong Travel"
          className="h-12 w-auto rounded-lg bg-card/90 object-contain px-3 py-1"
        />
        <h1 className="font-display mt-1 text-3xl font-semibold">Staff area</h1>
      </header>

      <div className="mx-auto max-w-md px-6 py-10">
        <form onSubmit={submit} className="space-y-4 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div>
            <label htmlFor="staff-email" className="block text-base font-bold text-ink">
              Email
            </label>
            <input
              id="staff-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 min-h-14 w-full rounded-2xl border-2 border-input bg-background px-4 text-lg text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="staff-password" className="block text-base font-bold text-ink">
              Password
            </label>
            <input
              id="staff-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 min-h-14 w-full rounded-2xl border-2 border-input bg-background px-4 text-lg text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-base font-semibold text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || !email.trim() || !password}
            className="min-h-14 w-full rounded-2xl bg-primary px-6 text-lg font-bold text-primary-foreground uppercase disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Authorised Windsong Travel staff only.
          </p>
        </form>
      </div>
      <PoweredByTapp />
    </div>
  );
}
