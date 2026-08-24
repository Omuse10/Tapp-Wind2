import { useJourney } from "@/lib/journey/store";

export function WordOfTheDay() {
  const { wordOfTheDay } = useJourney();

  const speak = () => {
    try {
      const u = new SpeechSynthesisUtterance(wordOfTheDay.word.toLowerCase());
      u.rate = 0.75;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* silent — listening is a bonus, never an error */
    }
  };

  return (
    <section className="rounded-3xl bg-sand p-6 text-center shadow-[var(--shadow-card)]">
      <p className="text-sm font-bold tracking-[0.2em] text-sand-foreground uppercase">
        🇰🇪 Swahili word of the day
      </p>
      <p className="font-display mt-4 text-5xl font-semibold tracking-tight text-ink">
        {wordOfTheDay.word}
      </p>
      <p className="mt-2 text-xl text-ink">{wordOfTheDay.meaning}</p>
      <p className="mt-1 text-base text-muted-foreground">{wordOfTheDay.pronunciation}</p>
      <button
        type="button"
        onClick={speak}
        className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-ink px-6 text-lg font-extrabold tracking-wide text-primary-foreground uppercase"
      >
        🔊 Listen
      </button>
    </section>
  );
}