import { createFileRoute, redirect } from "@tanstack/react-router";

// The staff area now lives at /staff behind Supabase staff authentication.
export const Route = createFileRoute("/manager")({
  beforeLoad: () => {
    throw redirect({ to: "/staff", replace: true });
  },
});
