// Registers the offline service worker only in the published app.
//
// Never in the Lovable editor preview, an iframe, or development.

function isPreviewHost(hostname: string) {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

async function unregisterAppWorker() {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.allSettled(
    registrations
      .filter((r) =>
        (r.active?.scriptURL ?? r.installing?.scriptURL ?? r.waiting?.scriptURL ?? "").includes(
          "/sw.js",
        ),
      )
      .map((r) => r.unregister()),
  );
}

export function registerOfflineSupport() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const refused =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    isPreviewHost(window.location.hostname) ||
    new URLSearchParams(window.location.search).get("sw") === "off";

  if (refused) {
    void unregisterAppWorker();
    return;
  }

  // Make sure the generated service worker actually exists before
  // attempting to register it.
  void fetch("/sw.js", {
    method: "HEAD",
    cache: "no-store",
  })
    .then((response) => {
      if (!response.ok) {
        console.warn(`[offline] Service worker unavailable: ${response.status}`);
        return;
      }

      return navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
        console.warn("[offline] Service worker registration failed:", error);
      });
    })
    .catch(() => {
      // Offline support is optional; the app still works without it.
    });
}
