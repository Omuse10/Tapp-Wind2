import { MapsLink } from "@/components/journey/MapsLink";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { LocationRecord } from "@/lib/journey/types";

export function LocationDialog({
  location,
  onClose,
}: {
  location: LocationRecord | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!location} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-3xl">
        {location ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-left text-3xl font-semibold text-ink">
                📍 {location.name}
              </DialogTitle>
            </DialogHeader>
            <p className="text-lg leading-relaxed text-foreground">{location.description}</p>
            <MapsLink
              lat={location.lat}
              lng={location.lng}
              label={location.name}
              className="mt-2 flex min-h-16 items-center justify-center rounded-3xl bg-primary text-lg font-extrabold tracking-wide text-primary-foreground uppercase"
            >
              📍 Open in Maps
            </MapsLink>
            <button
              type="button"
              onClick={onClose}
              className="min-h-14 rounded-3xl bg-secondary text-lg font-bold text-secondary-foreground"
            >
              Close
            </button>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}