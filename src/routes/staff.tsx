import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { ManagerDashboard } from "@/components/journey/ManagerDashboard";
import { signOutStaff, useStaffSession } from "@/lib/staff/auth";

export const Route = createFileRoute("/staff")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Windsong Journey Manager — Staff area" },
      { name: "description", content: "Authorised staff area for Windsong Travel: manage journeys, itineraries and trip content." },
      { property: "og:title", content: "Windsong Journey Manager — Staff area" },
      { property: "og:description", content: "Manage the Windsong Travel journey content." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffArea,
});

function StaffArea() {
  const navigate = useNavigate();
  const session = useStaffSession();

  useEffect(() => {
    if (session.status === "signed-out") void navigate({ to: "/staff-login", replace: true });
  }, [session.status, navigate]);

  if (session.status === "loading" || session.status === "signed-out") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-secondary/40 px-6 text-center">
        <p className="text-lg text-muted-foreground">Checking your staff access…</p>
      </div>
    );
  }

  if (session.status === "unauthorized") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-secondary/40 px-6">
        <div className="max-w-md rounded-3xl bg-card p-6 text-center shadow-[var(--shadow-card)]">
          <h1 className="font-display text-3xl font-semibold text-ink">Access denied</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {session.email ?? "This account"} is not an authorised Windsong staff member.
          </p>
          <button
            type="button"
            onClick={async () => {
              await signOutStaff();
              await navigate({ to: "/staff-login", replace: true });
            }}
            className="mt-6 min-h-14 w-full rounded-2xl bg-primary px-6 text-lg font-bold text-primary-foreground uppercase"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <ManagerDashboard staffEmail={session.staff.email} />;
}
