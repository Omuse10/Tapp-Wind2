import { Check, Plus, Share, X } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { BigButton } from "@/components/journey/BigButton";

const WELCOME_SEEN_KEY = "windsong_install_welcome_seen";
const INSTALLED_KEY = "windsong_installed";

type InstallState = "checking" | "installed" | "available" | "ios" | "unsupported";
type InstallResult = "accepted" | "dismissed" | "ios" | "unavailable";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallContextValue = {
  state: InstallState;
  seen: boolean;
  promptInstall: () => Promise<InstallResult>;
  skipWelcome: () => void;
};

const InstallContext = createContext<InstallContextValue | null>(null);

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  const userAgent = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

function readFlag(key: string) {
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeFlag(key: string) {
  try {
    window.localStorage.setItem(key, "true");
  } catch {
    // Continue without persistence when storage is unavailable.
  }
}

export function InstallWindsongProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InstallState>("checking");
  const [seen, setSeen] = useState(false);
  const [iosHelpOpen, setIosHelpOpen] = useState(false);
  const promptEvent = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const installed = isStandalone() || readFlag(INSTALLED_KEY);
    const alreadySeen = readFlag(WELCOME_SEEN_KEY);
    setSeen(alreadySeen);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      promptEvent.current = event as BeforeInstallPromptEvent;
      setState("available");
    };
    const onAppInstalled = () => {
      writeFlag(INSTALLED_KEY);
      writeFlag(WELCOME_SEEN_KEY);
      setSeen(true);
      setState("installed");
      promptEvent.current = null;
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    if (installed) setState("installed");
    else if (isIOS()) setState("ios");
    else setState("unsupported");

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const skipWelcome = () => {
    writeFlag(WELCOME_SEEN_KEY);
    setSeen(true);
  };

  const promptInstall = async (): Promise<InstallResult> => {
    if (state === "ios") {
      setIosHelpOpen(true);
      return "ios";
    }

    const event = promptEvent.current;
    if (!event) return "unavailable";

    await event.prompt();
    const choice = await event.userChoice;
    skipWelcome();
    if (choice.outcome === "accepted") {
      setState("installed");
      writeFlag(INSTALLED_KEY);
      return "accepted";
    }

    setState("available");
    return "dismissed";
  };

  return (
    <InstallContext.Provider value={{ state, seen, promptInstall, skipWelcome }}>
      {children}
      <IosInstructions open={iosHelpOpen} onClose={() => setIosHelpOpen(false)} />
    </InstallContext.Provider>
  );
}

function useInstallWindsong() {
  const context = useContext(InstallContext);
  if (!context) throw new Error("useInstallWindsong must be used inside InstallWindsongProvider");
  return context;
}

export function InstallWindsongGate({ children }: { children: ReactNode }) {
  const { state, seen, promptInstall, skipWelcome } = useInstallWindsong();
  const pathname = useRouterState({ select: (routerState) => routerState.location.pathname });
  const [continuing, setContinuing] = useState(false);

  if (
    pathname === "/staff" ||
    pathname.startsWith("/staff/") ||
    pathname === "/staff-login" ||
    state === "checking" ||
    state === "installed" ||
    seen
  ) {
    return children;
  }

  const install = async () => {
    setContinuing(true);
    const result = await promptInstall();
    if (result === "ios") {
      setContinuing(false);
      return;
    }
    setContinuing(false);
  };

  return (
    <div className="min-h-dvh bg-background px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-lg flex-col justify-center text-center">
        <div className="mx-auto flex size-24 items-center justify-center rounded-3xl bg-card p-3 shadow-[var(--shadow-card)]">
          <img src="/icon-192.png" alt="Windsong Travel" className="size-full rounded-2xl" />
        </div>
        <p className="mt-6 text-sm font-extrabold tracking-[0.28em] text-primary uppercase">
          Windsong Travel
        </p>
        <h1 className="font-display mt-3 text-4xl font-semibold text-ink">Add Windsong to your phone</h1>
        <p className="mt-5 text-xl leading-relaxed text-foreground">
          Keep your trip companion one tap away — access your itinerary, memories, guides and trip
          information easily, even when you're offline.
        </p>

        {state === "unsupported" ? (
          <p className="mt-6 rounded-3xl bg-secondary px-5 py-4 text-lg leading-relaxed text-secondary-foreground">
            Windsong is designed to work beautifully on your phone. Open Windsong on your mobile
            device to add it to your Home Screen.
          </p>
        ) : null}

        {state === "available" || state === "ios" ? (
          <BigButton type="button" className="mt-8" onClick={() => void install()} disabled={continuing}>
            {continuing ? "Opening…" : "Add Windsong to Home Screen"}
          </BigButton>
        ) : null}

        <button
          type="button"
          className="mt-5 min-h-14 px-5 text-lg font-bold text-primary underline underline-offset-4"
          onClick={skipWelcome}
        >
          Continue to Windsong
        </button>
        <p className="mt-8 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">Powered by Tapp</p>
      </div>
    </div>
  );
}

export function InstallWindsongAction() {
  const { state, promptInstall } = useInstallWindsong();

  if (state === "checking" || state === "installed") return null;
  if (state === "unsupported") {
    return (
      <p className="rounded-3xl bg-secondary px-5 py-4 text-lg leading-relaxed text-secondary-foreground">
        Open Windsong on your phone to add it to your Home Screen.
      </p>
    );
  }

  return (
    <BigButton type="button" variant="soft" onClick={() => void promptInstall()}>
      Add Windsong to Home Screen
    </BigButton>
  );
}

function IosInstructions({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-4 sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="ios-install-title" className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold tracking-[0.2em] text-primary uppercase">Windsong Travel</p>
            <h2 id="ios-install-title" className="font-display mt-2 text-3xl font-semibold text-ink">
              Add Windsong to your Home Screen
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-muted-foreground">
            <X aria-hidden className="size-6" />
          </button>
        </div>
        <ol className="mt-6 space-y-5 text-xl text-foreground">
          <InstructionStep number="1" icon={<Share aria-hidden />} text="Tap the Share button in Safari." />
          <InstructionStep number="2" icon={<Plus aria-hidden />} text="Select Add to Home Screen." />
          <InstructionStep number="3" icon={<Check aria-hidden />} text="Tap Add." />
        </ol>
        <BigButton type="button" className="mt-7" onClick={onClose}>
          Got it
        </BigButton>
      </div>
    </div>
  );
}

function InstructionStep({ number, icon, text }: { number: string; icon: ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
        {icon}
      </span>
      <span>
        <strong className="mr-2 text-primary">{number}</strong>
        {text}
      </span>
    </li>
  );
}

export { useInstallWindsong };
