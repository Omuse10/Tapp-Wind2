import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

const base =
  "flex min-h-16 w-full items-center justify-center gap-3 rounded-3xl px-6 py-4 text-lg font-extrabold tracking-wide uppercase transition-transform active:scale-[0.98]";

const styles = {
  primary: "bg-primary text-primary-foreground shadow-[var(--shadow-card)]",
  soft: "bg-secondary text-secondary-foreground",
  outline: "border-2 border-primary bg-card text-primary",
  dark: "bg-ink text-primary-foreground",
} as const;

type Variant = keyof typeof styles;

export function BigButton({
  variant = "primary",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; children: ReactNode }) {
  return (
    <button type="button" className={cn(base, styles[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function BigLink({
  variant = "primary",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; children: ReactNode }) {
  return (
    <Link className={cn(base, styles[variant], className)} {...props}>
      {children}
    </Link>
  );
}