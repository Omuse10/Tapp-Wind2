import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

/**
 * Large "← Back" control. Returns to the exact previous page using the
 * application's navigation history, and falls back to Home on a cold start.
 */
export function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  const classes = cn(
    "flex min-h-14 items-center gap-2 rounded-3xl bg-secondary px-6 text-lg font-extrabold tracking-wide text-secondary-foreground uppercase transition-transform active:scale-[0.98]",
    className,
  );

  return (
    <div className="px-6 pt-4">
      <button
        type="button"
        aria-label="Back"
        onClick={() => (canGoBack ? router.history.back() : void navigate({ to: "/home" }))}
        className={classes}
      >
        <span aria-hidden>←</span> Back
      </button>
    </div>
  );
}
