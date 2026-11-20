"use client";

import { useEffect, useState } from "react";
import { getQuote, type Quote } from "../lib/quotes";

export default function QuoteOfTheDay() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const retryQuote = async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      setQuote(await getQuote());
    } catch (error) {
      console.error("Failed to load quote of the day:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    getQuote(controller.signal)
      .then(setQuote)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load quote of the day:", error);
        setHasError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="bg-[#f6b71d] px-6 py-14 text-[#071b33] sm:py-16">
      <div className="mx-auto max-w-4xl text-center" aria-live="polite">
        <p className="text-[11px] font-extrabold tracking-[.18em]">QUOTE OF THE MOMENT</p>
        {isLoading ? (
          <p className="mt-5 text-sm font-semibold">Loading today&apos;s quote...</p>
        ) : hasError || !quote ? (
          <div className="mt-5">
            <p className="text-sm font-semibold">The quote is unavailable right now.</p>
            <button
              type="button"
              onClick={retryQuote}
              className="mt-3 text-xs font-extrabold underline underline-offset-4"
            >
              TRY AGAIN
            </button>
          </div>
        ) : (
          <>
            <blockquote className="mt-5 font-condensed text-4xl font-extrabold uppercase leading-[.95] sm:text-5xl">
              “{quote.quote}”
            </blockquote>
            <p className="mt-5 text-sm font-bold">
              — {quote.author}
              {quote.when ? `, ${quote.when}` : ""}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
