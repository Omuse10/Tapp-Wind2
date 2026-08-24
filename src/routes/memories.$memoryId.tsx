import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell, BrandHeader, PoweredByTapp } from "@/components/journey/AppShell";
import { BackButton } from "@/components/journey/BackButton";
import { BigButton, BigLink } from "@/components/journey/BigButton";
import { resolveImage } from "@/lib/journey/images";
import { formatShortDate, useJourney } from "@/lib/journey/store";

export const Route = createFileRoute("/memories/$memoryId")({
  head: () => ({
    meta: [
      { title: "A Memory — Windsong Travel Africa 2026" },
      { name: "description", content: "A photograph and story from the Windsong Travel Africa 2026 journey." },
      { property: "og:title", content: "A Memory — Windsong Travel Africa 2026" },
      { property: "og:description", content: "A photograph and story shared by our group." },
    ],
  }),
  component: MemoryDetail,
});

function MemoryDetail() {
  const { memoryId } = useParams({ from: "/memories/$memoryId" });
  const navigate = useNavigate();
  const { data, likeCount, hasLiked, toggleLike, commentsFor, addComment, editMemory, deleteMemory } =
    useJourney();
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const memory = data.memories.find((m) => m.id === memoryId);

  if (!memory) {
    return (
      <AppShell>
        <BrandHeader />
        <BackButton />
        <div className="px-6 pt-10 text-center">
          <p className="text-xl text-muted-foreground">We could not find that memory.</p>
          <BigLink to="/memories" className="mt-6">
            Back to our memories
          </BigLink>
        </div>
      </AppShell>
    );
  }

  const comments = commentsFor(memory.id);

  return (
    <AppShell>
      <BackButton />
      <img src={resolveImage(memory.photo)} alt={memory.description} className="w-full object-cover" />
      <div className="px-6 pt-6">
        <h1 className="font-display text-3xl font-semibold text-ink">{memory.guestName}</h1>
        <p className="mt-1 text-lg text-muted-foreground">📍 {memory.locationName}</p>
        <p className="text-lg text-muted-foreground">{formatShortDate(memory.createdAt)}</p>
        {editing ? (
          <>
            <textarea
              aria-label="Edit description"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              className="mt-4 w-full rounded-3xl border-2 border-input bg-card p-5 text-xl text-foreground focus:border-primary focus:outline-none"
            />
            <BigButton
              className="mt-3"
              disabled={!draft.trim()}
              onClick={() => {
                editMemory(memory.id, { description: draft.trim() });
                setEditing(false);
              }}
            >
              Save changes
            </BigButton>
            <BigButton variant="soft" className="mt-3" onClick={() => setEditing(false)}>
              Cancel
            </BigButton>
          </>
        ) : (
          <p className="mt-4 text-xl leading-relaxed text-foreground">{memory.description}</p>
        )}

        {memory.guestId === (data.meGuestId ?? "me") && !editing ? (
          <>
            <BigButton
              variant="soft"
              className="mt-6"
              onClick={() => {
                setDraft(memory.description);
                setEditing(true);
              }}
            >
              ✏️ Edit this memory
            </BigButton>
            {confirmDelete ? (
              <>
                <p className="mt-6 text-center text-xl font-bold text-ink">Delete this memory?</p>
                <BigButton
                  className="mt-3"
                  onClick={() => {
                    deleteMemory(memory.id);
                    void navigate({ to: "/memories" });
                  }}
                >
                  Yes, delete it
                </BigButton>
                <BigButton variant="soft" className="mt-3" onClick={() => setConfirmDelete(false)}>
                  Keep it
                </BigButton>
              </>
            ) : (
              <BigButton variant="soft" className="mt-3" onClick={() => setConfirmDelete(true)}>
                🗑️ Delete this memory
              </BigButton>
            )}
          </>
        ) : null}

        <BigButton variant="soft" className="mt-6" onClick={() => toggleLike(memory.id)}>
          {hasLiked(memory.id) ? "❤️" : "🤍"} {likeCount(memory.id)} likes
        </BigButton>

        <h2 className="mt-8 text-sm font-bold tracking-[0.2em] text-primary uppercase">Comments</h2>
        {comments.length === 0 ? (
          <p className="mt-3 text-lg text-muted-foreground">Be the first to leave a kind message.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
                <p className="text-lg font-bold text-ink">{c.guestName}</p>
                <p className="mt-1 text-lg text-foreground">{c.text}</p>
              </li>
            ))}
          </ul>
        )}

        <label htmlFor="comment" className="mt-6 block text-lg font-bold text-ink">
          Leave a message
        </label>
        <textarea
          id="comment"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Say something kind"
          className="mt-2 w-full rounded-3xl border-2 border-input bg-card p-5 text-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <BigButton
          className="mt-3"
          disabled={!text.trim()}
          onClick={() => {
            addComment(memory.id, text.trim());
            setText("");
          }}
        >
          Send message
        </BigButton>
      </div>
      <PoweredByTapp />
    </AppShell>
  );
}