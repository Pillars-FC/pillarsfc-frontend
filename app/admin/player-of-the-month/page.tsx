"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import Navbar from "../../components/Navbar";
import { getAdminSession, logoutAdmin } from "../../lib/admin";
import {
  advancePlayerRound,
  closePlayerRound,
  getAdminPlayerRound,
  openPlayerRound,
  type AdminPlayerRound,
} from "../../lib/player-of-the-month";

function requestMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return "Could not update the Player of the Month round. Please try again.";
}

export default function AdminPlayerOfTheMonthPage() {
  const [round, setRound] = useState<AdminPlayerRound | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awardPeriod, setAwardPeriod] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let isMounted = true;
    getAdminSession()
      .then(async () => {
        if (!isMounted) return;
        setIsAuthenticated(true);
        const adminRound = await getAdminPlayerRound();
        if (isMounted) setRound(adminRound);
      })
      .catch((requestError: unknown) => {
        if (!isMounted) return;
        if (
          !(axios.isAxiosError(requestError) && requestError.response?.status === 401)
        ) {
          console.error("Failed to load the admin Player of the Month page:", requestError);
          setError("Admin controls are unavailable. Check the backend configuration.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSession(false);
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenRound = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setFeedback("");
    try {
      setRound(await openPlayerRound(awardPeriod));
      setFeedback("The nomination round is now open.");
    } catch (requestError) {
      console.error("Failed to open a Player of the Month round:", requestError);
      setError(requestMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceRound = async () => {
    if (!round) return;
    setIsSubmitting(true);
    setError("");
    setFeedback("");
    try {
      setRound(await advancePlayerRound(round.round_id));
      setFeedback("The top four nominees are now in the poll.");
    } catch (requestError) {
      console.error("Failed to advance the Player of the Month round:", requestError);
      setError(requestMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseRound = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!round || !image) return;
    setIsSubmitting(true);
    setError("");
    setFeedback("");
    try {
      const closedRound = await closePlayerRound(
        round.round_id,
        description,
        image,
      );
      setRound(closedRound);
      setDescription("");
      setImage(null);
      setFileInputKey((key) => key + 1);
      setFeedback("The poll is closed and the Player of the Month is published.");
    } catch (requestError) {
      console.error("Failed to close the Player of the Month poll:", requestError);
      setError(requestMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await logoutAdmin();
      setIsAuthenticated(false);
      setRound(null);
      setFeedback("You have been signed out.");
    } catch (requestError) {
      console.error("Admin logout failed:", requestError);
      setError("Could not sign out. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <p className="text-[11px] font-extrabold tracking-[.16em] text-[#075aa6]">
          CLUB ADMINISTRATION
        </p>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-condensed text-6xl font-black uppercase leading-[.82] text-[#071b33] sm:text-7xl">
              Player of the Month
            </h1>
            <p className="mt-4 text-sm text-slate-500">
              Open nominations, move the top four into the poll, then close
              voting to publish the winner.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/player-of-the-month"
              className="w-fit border border-slate-200 px-4 py-3 text-xs font-extrabold text-[#075aa6]"
            >
              VIEW PUBLIC PAGE
            </Link>
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSubmitting}
                className="w-fit border border-slate-200 px-4 py-3 text-xs font-extrabold text-[#071b33] disabled:opacity-50"
              >
                SIGN OUT
              </button>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-8 bg-white p-5 text-sm text-red-700">
            {error}
          </p>
        )}
        {feedback && (
          <p role="status" className="mt-4 bg-white p-5 text-sm text-green-700">
            {feedback}
          </p>
        )}

        {isCheckingSession || isLoading ? (
          <p className="mt-8 bg-white p-8 text-center text-sm text-slate-500" aria-live="polite">
            Checking admin session...
          </p>
        ) : !isAuthenticated ? (
          <section className="mt-8 bg-white p-8 text-center">
            <p className="text-sm text-slate-600">
              Sign in as an admin to manage nominations and polls.
            </p>
            <Link
              href="/admin/members"
              className="mt-5 inline-block bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white"
            >
              ADMIN SIGN IN
            </Link>
          </section>
        ) : (
          <section className="mt-8 space-y-6">
            {round ? (
              <>
              <article className="bg-white p-6 shadow-[0_6px_26px_rgba(13,35,50,.06)] sm:p-8">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-[10px] font-extrabold tracking-[.16em] text-[#075aa6]">
                      {round.award_period}
                    </p>
                    <h2 className="mt-2 font-condensed text-4xl font-black uppercase text-[#071b33]">
                      {round.phase === "nominations"
                        ? "Nominations open"
                        : round.phase === "finalizing"
                          ? "Preparing the poll"
                          : round.phase === "voting"
                            ? "Voting open"
                            : "Poll closed"}
                    </h2>
                  </div>
                  <span className="w-fit bg-slate-100 px-3 py-2 text-[10px] font-extrabold tracking-wider text-slate-600">
                    {round.nomination_count} NOMINATIONS
                  </span>
                </div>

                {round.phase === "nominations" && (
                  <>
                    <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                      {round.nominations.length === 0 ? (
                        <p className="py-5 text-sm text-slate-500">
                          No members have nominated a player yet.
                        </p>
                      ) : (
                        round.nominations.map((nominee, index) => (
                          <div
                            key={nominee.membership_id}
                            className="flex items-center gap-3 py-3"
                          >
                            <span className="w-8 font-mono text-sm text-slate-400">
                              {index + 1}.
                            </span>
                            {nominee.image_url ? (
                              <Image
                                src={nominee.image_url}
                                alt=""
                                width={44}
                                height={44}
                                className="h-11 w-11 rounded-full object-cover"
                              />
                            ) : (
                              <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-50 font-extrabold text-[#075aa6]">
                                {nominee.name.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                            <span className="flex-1 font-bold text-[#071b33]">
                              {nominee.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {nominee.nomination_count}{" "}
                              {nominee.nomination_count === 1 ? "nomination" : "nominations"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    <p className="mt-4 text-xs leading-5 text-slate-500">
                      Ties for the fourth place are resolved by the earliest
                      nomination, then membership ID.
                    </p>
                    <button
                      type="button"
                      onClick={handleAdvanceRound}
                      disabled={isSubmitting || round.nominations.length < 4}
                      className="mt-5 bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? "PREPARING..." : "ADVANCE TOP FOUR TO POLL"}
                    </button>
                    {round.nominations.length < 4 && (
                      <p className="mt-2 text-xs text-slate-500">
                        At least four different players must be nominated first.
                      </p>
                    )}
                  </>
                )}

                {round.phase === "finalizing" && (
                  <div className="mt-5">
                    <p className="text-sm text-slate-600">
                      The nomination list is being finalized.
                    </p>
                    <button
                      type="button"
                      onClick={handleAdvanceRound}
                      disabled={isSubmitting}
                      className="mt-4 bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white disabled:opacity-50"
                    >
                      {isSubmitting ? "PREPARING..." : "CONTINUE TO POLL"}
                    </button>
                  </div>
                )}

                {round.phase === "voting" && (
                  <>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {round.candidates.map((candidate) => (
                        <div
                          key={candidate.membership_id}
                          className="flex items-center gap-3 border border-slate-200 p-3"
                        >
                          {candidate.image_url ? (
                            <Image
                              src={candidate.image_url}
                              alt=""
                              width={56}
                              height={56}
                              className="h-14 w-14 rounded-full object-cover"
                            />
                          ) : (
                            <span className="grid h-14 w-14 place-items-center rounded-full bg-blue-50 font-extrabold text-[#075aa6]">
                              {candidate.name.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          <span className="flex-1">
                            <span className="block font-bold text-[#071b33]">
                              {candidate.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {candidate.nomination_count} nominations · {candidate.vote_count} votes
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleCloseRound} className="mt-7 grid gap-5 border-t border-slate-200 pt-6">
                      <h3 className="font-condensed text-3xl font-extrabold uppercase text-[#071b33]">
                        Close poll &amp; publish winner
                      </h3>
                      <p className="text-sm leading-6 text-slate-500">
                        The highest vote-getter is selected automatically.
                        Nomination count, then earliest nomination, breaks a
                        voting tie. Add the winner&apos;s story and photo below.
                      </p>
                      <label>
                        <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                          WINNER DESCRIPTION
                        </span>
                        <textarea
                          value={description}
                          onChange={(event) => setDescription(event.target.value)}
                          required
                          minLength={10}
                          maxLength={2000}
                          rows={5}
                          placeholder="Share why this player earned the award."
                          className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                        />
                      </label>
                      <label>
                        <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                          WINNER PHOTO (JPEG/PNG/WEBP, MAX 5 MB)
                        </span>
                        <input
                          key={fileInputKey}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          required
                          onChange={(event) =>
                            setImage(event.currentTarget.files?.[0] ?? null)
                          }
                          className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:text-xs file:font-bold"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={isSubmitting || !image}
                        className="w-fit bg-[#f6b71d] px-5 py-3 text-xs font-extrabold text-[#152238] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmitting ? "PUBLISHING..." : "CLOSE POLL & PUBLISH"}
                      </button>
                    </form>
                  </>
                )}

                {round.phase === "closed" && round.winner && (
                  <div className="mt-6 grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-[180px_1fr]">
                    <Image
                      src={round.winner.image_url}
                      alt={`${round.winner.name} Player of the Month`}
                      width={360}
                      height={360}
                      className="h-44 w-full rounded object-cover sm:h-45"
                    />
                    <div>
                      <p className="text-[10px] font-extrabold tracking-wider text-[#075aa6]">
                        PUBLISHED WINNER
                      </p>
                      <h3 className="mt-2 font-condensed text-3xl font-black uppercase text-[#071b33]">
                        {round.winner.name}
                      </h3>
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {round.winner.description}
                      </p>
                    </div>
                  </div>
                )}
              </article>
              {round.phase === "closed" && (
                <form
                  onSubmit={handleOpenRound}
                  className="bg-white p-6 shadow-[0_6px_26px_rgba(13,35,50,.06)] sm:p-8"
                >
                  <h2 className="font-condensed text-3xl font-extrabold uppercase text-[#071b33]">
                    Open the next nomination round
                  </h2>
                  <label className="mt-5 block max-w-sm">
                    <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                      AWARD PERIOD
                    </span>
                    <input
                      value={awardPeriod}
                      onChange={(event) => setAwardPeriod(event.target.value)}
                      required
                      minLength={3}
                      maxLength={40}
                      placeholder="e.g. November 2026"
                      className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-5 bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white disabled:opacity-50"
                  >
                    {isSubmitting ? "OPENING..." : "OPEN NOMINATIONS"}
                  </button>
                </form>
              )}
              </>
            ) : (
              <form
                onSubmit={handleOpenRound}
                className="bg-white p-6 shadow-[0_6px_26px_rgba(13,35,50,.06)] sm:p-8"
              >
                <h2 className="font-condensed text-3xl font-extrabold uppercase text-[#071b33]">
                  Open a nomination round
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Members can each nominate one active directory member. The
                  four most-nominated players advance to the vote.
                </p>
                <label className="mt-5 block max-w-sm">
                  <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                    AWARD PERIOD
                  </span>
                  <input
                    value={awardPeriod}
                    onChange={(event) => setAwardPeriod(event.target.value)}
                    required
                    minLength={3}
                    maxLength={40}
                    placeholder="e.g. December 2026"
                    className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-5 bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white disabled:opacity-50"
                >
                  {isSubmitting ? "OPENING..." : "OPEN NOMINATIONS"}
                </button>
              </form>
            )}
          </section>
        )}
      </main>
    </>
  );
}
