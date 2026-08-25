import { createFileRoute } from "@tanstack/react-router";
import { FileText, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { AppShell, BrandHeader, PoweredByTapp } from "@/components/journey/AppShell";
import { BackButton } from "@/components/journey/BackButton";
import { BigButton } from "@/components/journey/BigButton";

const DOCUMENT_TYPES = ["Passport", "Visa", "Travel Document", "Insurance", "Other"] as const;
const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.webp";
const ACCEPTED_LABEL = "PDF, JPG, JPEG, PNG or WEBP · up to 10 MB";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type DocumentType = (typeof DOCUMENT_TYPES)[number];
type MockDocument = {
  id: string;
  name: string;
  type: DocumentType;
  fileName: string;
  size: number;
  uploadedAt: string;
};

const INITIAL_DOCUMENTS: MockDocument[] = [
  {
    id: "mock-passport",
    name: "My Passport",
    type: "Passport",
    fileName: "passport-scan.pdf",
    size: 1_850_000,
    uploadedAt: "12 August 2026",
  },
  {
    id: "mock-insurance",
    name: "Travel Insurance",
    type: "Insurance",
    fileName: "windsong-cover.pdf",
    size: 920_000,
    uploadedAt: "10 August 2026",
  },
];

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "My Travel Documents — Windsong Travel Africa 2026" },
      { name: "description", content: "Keep your important travel documents together for your journey." },
    ],
  }),
  component: Documents,
});

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function typeIcon(type: DocumentType) {
  return {
    Passport: "🛂",
    Visa: "🛃",
    "Travel Document": "📄",
    Insurance: "🏥",
    Other: "📎",
  }[type];
}

function Documents() {
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [name, setName] = useState("");
  const [type, setType] = useState<DocumentType>("Passport");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chooseFile = (candidate: File | undefined) => {
    setMessage(null);
    if (!candidate) return;
    if (candidate.size > MAX_FILE_SIZE) {
      setFile(null);
      setMessage({ kind: "error", text: "That file is larger than 10 MB. Please choose a smaller file." });
      return;
    }
    const extension = candidate.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "jpg", "jpeg", "png", "webp"].includes(extension)) {
      setFile(null);
      setMessage({ kind: "error", text: "Please choose a PDF, JPG, JPEG, PNG or WEBP file." });
      return;
    }
    setFile(candidate);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (!name.trim()) {
      setMessage({ kind: "error", text: "Give this document a name first." });
      return;
    }
    if (!file) {
      setMessage({ kind: "error", text: "Choose a file to add." });
      return;
    }

    setUploading(true);
    window.setTimeout(() => {
      setDocuments((current) => [
        {
          id: `${Date.now()}`,
          name: name.trim(),
          type,
          fileName: file.name,
          size: file.size,
          uploadedAt: "Just now",
        },
        ...current,
      ]);
      setName("");
      setType("Passport");
      setFile(null);
      setUploading(false);
      setMessage({ kind: "success", text: "Document added to your travel documents." });
    }, 700);
  };

  return (
    <AppShell>
      <BrandHeader />
      <BackButton />
      <header className="px-6 pt-8">
        <h1 className="font-display text-4xl font-semibold tracking-wide text-ink uppercase">
          My Travel Documents
        </h1>
        <p className="mt-2 text-xl text-muted-foreground">
          Keep your important travel documents safely in one place.
        </p>
      </header>

      <main className="space-y-8 px-6 pt-6">
        <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-2xl" aria-hidden>
              📄
            </span>
            <h2 className="font-display text-3xl font-semibold text-ink">Add Document</h2>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="document-name" className="text-lg font-bold text-ink">
                Document name
              </label>
              <input
                id="document-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Kenya Visa"
                className="mt-2 min-h-16 w-full rounded-3xl border-2 border-input bg-background px-5 text-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="document-type" className="text-lg font-bold text-ink">
                Document type
              </label>
              <select
                id="document-type"
                value={type}
                onChange={(event) => setType(event.target.value as DocumentType)}
                className="mt-2 min-h-16 w-full rounded-3xl border-2 border-input bg-background px-5 text-xl text-foreground focus:border-primary focus:outline-none"
              >
                {DOCUMENT_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {typeIcon(option)} {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-lg font-bold text-ink">File</p>
              <button
                type="button"
                className={`mt-2 flex min-h-36 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-5 text-center transition-colors ${dragging ? "border-primary bg-secondary" : "border-primary/50 bg-background"}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  chooseFile(event.dataTransfer.files[0]);
                }}
              >
                <Upload aria-hidden className="size-9 text-primary" />
                <span className="mt-2 text-lg font-bold text-ink">
                  {file ? "Change selected file" : "Choose a file or take a photo"}
                </span>
                <span className="mt-1 text-base text-muted-foreground">{ACCEPTED_LABEL}</span>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                capture="environment"
                className="sr-only"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
            </div>

            {file ? (
              <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
                <FileText aria-hidden className="size-6 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold text-ink">{file.name}</p>
                  <p className="text-base text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  aria-label="Remove selected file"
                  className="rounded-full p-2 text-muted-foreground hover:bg-card hover:text-ink"
                  onClick={() => setFile(null)}
                >
                  <X aria-hidden className="size-6" />
                </button>
              </div>
            ) : null}

            {message ? (
              <p className={`rounded-2xl px-4 py-3 text-lg ${message.kind === "error" ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}`} role="status">
                {message.text}
              </p>
            ) : null}

            <BigButton type="submit" disabled={uploading}>
              {uploading ? "Adding document…" : "+ Add document"}
            </BigButton>
          </form>
        </section>

        <section>
          <h2 className="font-display text-3xl font-semibold tracking-wide text-ink uppercase">My Documents</h2>
          <div className="mt-4 space-y-3">
            {documents.map((document) => (
              <article key={document.id} className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-2xl" aria-hidden>
                    {typeIcon(document.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold tracking-[0.16em] text-primary uppercase">{document.type}</p>
                    <h3 className="font-display mt-1 truncate text-2xl font-semibold text-ink">{document.name}</h3>
                    <p className="mt-1 truncate text-base text-muted-foreground">
                      {document.fileName} · {formatSize(document.size)}
                    </p>
                    <p className="mt-1 text-base text-muted-foreground">Added {document.uploadedAt}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button type="button" className="min-h-14 rounded-3xl border-2 border-primary bg-card px-4 text-base font-extrabold tracking-wide text-primary uppercase">
                    View
                  </button>
                  <button type="button" className="min-h-14 rounded-3xl bg-secondary px-4 text-base font-extrabold tracking-wide text-secondary-foreground uppercase">
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <PoweredByTapp />
    </AppShell>
  );
}
