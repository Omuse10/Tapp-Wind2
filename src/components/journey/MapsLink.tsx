import type { ReactNode } from "react";

import { mapsHref } from "@/lib/journey/maps";

// Renders a stable Google Maps href for the server, then hands off to the
// guest's own maps app (Apple Maps on iPhone) when they tap it.
export function MapsLink({
  lat,
  lng,
  label,
  className,
  children,
}: {
  lat: number;
  lng: number;
  label?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={(e) => {
        const href = mapsHref(lat, lng, label);
        if (href !== e.currentTarget.href) {
          e.preventDefault();
          window.open(href, "_blank", "noreferrer");
        }
      }}
    >
      {children ?? "📍 Open in Maps"}
    </a>
  );
}
