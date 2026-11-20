"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getExecutives, type Executive } from "../lib/executives";

const cardColors = ["bg-[#075aa6]", "bg-[#2c607b]", "bg-[#071b33]"];

export default function ExecutivesPage() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getExecutives(controller.signal)
      .then(setExecutives)
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load club executives:", requestError);
        setError("Executives are unavailable right now. Please try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const retryLoading = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setExecutives(await getExecutives());
    } catch (requestError) {
      console.error("Failed to load club executives:", requestError);
      setError("Executives are unavailable right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-310 px-6 py-16 sm:py-20">
        <p className="text-[11px] font-extrabold tracking-[.16em] text-[#075aa6]">
          LEADERSHIP & GOVERNANCE
        </p>
        <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <h1 className="font-condensed text-6xl font-black uppercase leading-[.8] text-[#071b33] sm:text-7xl">
            Club
            <br />
            Executives
          </h1>
          <p className="max-w-sm text-sm leading-6 text-slate-500">
            Meet the executive team working behind the scenes to shape the future of Pillars
            Football Club.
          </p>
        </div>

        {isLoading ? (
          <p className="mt-10 text-center text-sm text-slate-500" aria-live="polite">
            Loading executives...
          </p>
        ) : error ? (
          <div className="mt-10 text-center">
            <p role="alert" className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={retryLoading}
              className="mt-4 bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white"
            >
              TRY AGAIN
            </button>
          </div>
        ) : executives.length === 0 ? (
          <p className="mt-10 text-center text-sm text-slate-500">
            No executives are listed yet.
          </p>
        ) : (
          <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {executives.map((executive, index) => (
              <article
                key={executive.id}
                className="overflow-hidden bg-white shadow-[0_6px_26px_rgba(13,35,50,.06)]"
              >
                <div
                  role="img"
                  aria-label={executive.name}
                  className={`grid h-56 place-items-center bg-cover bg-center ${cardColors[index % cardColors.length]}`}
                  style={{
                    backgroundImage: `linear-gradient(0deg, rgba(7, 27, 51, .5), rgba(7, 27, 51, .1)), url("${executive.image}")`,
                  }}
                >
                  <span className="font-condensed text-8xl font-black text-white/90 drop-shadow">
                    {executive.name
                      .split(/\s+/)
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-[10px] font-extrabold tracking-[.14em] text-[#075aa6]">
                    {executive.position.toUpperCase()}
                  </p>
                  <h2 className="mt-2 font-condensed text-3xl font-extrabold uppercase leading-none text-[#071b33]">
                    {executive.name}
                  </h2>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
