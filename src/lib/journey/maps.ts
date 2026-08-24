// Opens a place in the guest's own maps application, with a browser fallback.

export function mapsHref(lat: number, lng: number, label?: string) {
  const query = encodeURIComponent(label ?? `${lat},${lng}`);
  const isApple =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) &&
    !/Android/.test(navigator.userAgent);
  if (isApple) return `https://maps.apple.com/?ll=${lat},${lng}&q=${query}`;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
