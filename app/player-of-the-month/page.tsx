"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Navbar from "../components/Navbar";
import {
  getMemberSession,
  loginMember,
  logoutMember,
  registerMemberAccount,
  type MemberSession,
} from "../lib/member-auth";
import {
  getMemberPollStatus,
  getNominatableMembers,
  getPlayerOfTheMonth,
  getPublicPlayerRound,
  nominatePlayer,
  voteForPlayer,
  type MemberPollStatus,
  type NominatableMember,
  type PlayerOfTheMonthWinner,
  type PublicPlayerRound,
} from "../lib/player-of-the-month";

function messageFromError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

export default function PlayerOfTheMonthPage() {
  const [winner, setWinner] = useState<PlayerOfTheMonthWinner | null>(null);
  const [round, setRound] = useState<PublicPlayerRound | null>(null);
  const [member, setMember] = useState<MemberSession | null>(null);
  const [participation, setParticipation] = useState<MemberPollStatus | null>(null);
  const [members, setMembers] = useState<NominatableMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isErrorFeedback, setIsErrorFeedback] = useState(false);
  const [authUnavailable, setAuthUnavailable] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedNominee, setSelectedNominee] = useState("");
  const [selectedVote, setSelectedVote] = useState("");

  const refreshPageData = useCallback(async () => {
    const [currentWinner, currentRound] = await Promise.all([
      getPlayerOfTheMonth(),
      getPublicPlayerRound(),
    ]);
    setWinner(currentWinner);
    setRound(currentRound);
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getPlayerOfTheMonth(), getPublicPlayerRound()])
      .then(([currentWinner, currentRound]) => {
        if (!isMounted) return;
        setWinner(currentWinner);
        setRound(currentRound);
      })
      .catch((requestError: unknown) => {
        if (!isMounted) return;
        console.error("Failed to load Player of the Month:", requestError);
        setError("Player of the Month information is unavailable right now.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    getMemberSession()
      .then(async (session) => {
        if (!isMounted) return;
        setMember(session);
        const status = await getMemberPollStatus();
        if (isMounted) setParticipation(status);
      })
      .catch((requestError: unknown) => {
        if (
          isMounted &&
          !(axios.isAxiosError(requestError) && requestError.response?.status === 401)
        ) {
          console.error("Failed to check member session:", requestError);
          setAuthUnavailable(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!member || round?.phase !== "nominations" || participation?.has_nominated) {
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      getNominatableMembers(memberSearch.trim(), controller.signal)
        .then(setMembers)
        .catch((requestError: unknown) => {
          if (controller.signal.aborted) return;
          console.error("Failed to search nominee list:", requestError);
          setFeedback("The member list could not be loaded. Please try again.");
          setIsErrorFeedback(true);
        });
    }, 200);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [member, memberSearch, participation?.has_nominated, round?.phase]);

  const handleMemberAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback("");
    setIsErrorFeedback(false);
    try {
      if (authMode === "register") {
        const result = await registerMemberAccount({ email, password });
        setFeedback(result.message);
        setPassword("");
      } else {
        const session = await loginMember({ email, password });
        setMember(session);
        setPassword("");
        setParticipation(await getMemberPollStatus());
        setFeedback(`Signed in as ${session.name}.`);
      }
    } catch (requestError) {
      console.error("Member account action failed:", requestError);
      setFeedback(
        messageFromError(
          requestError,
          authMode === "register"
            ? "Could not request account activation. Please try again."
            : "Could not sign in. Check your details and try again.",
        ),
      );
      setIsErrorFeedback(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    setFeedback("");
    try {
      await logoutMember();
      setMember(null);
      setParticipation(null);
      setMembers([]);
      setFeedback("You have been signed out.");
    } catch (requestError) {
      console.error("Member logout failed:", requestError);
      setFeedback("Could not sign out. Please try again.");
      setIsErrorFeedback(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNomination = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedNominee) return;
    setIsSubmitting(true);
    setFeedback("");
    setIsErrorFeedback(false);
    try {
      setFeedback(await nominatePlayer(selectedNominee));
      setParticipation((current) =>
        current ? { ...current, has_nominated: true } : current,
      );
      setSelectedNominee("");
    } catch (requestError) {
      console.error("Player nomination failed:", requestError);
      setFeedback(
        messageFromError(requestError, "Could not submit the nomination."),
      );
      setIsErrorFeedback(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedVote) return;
    setIsSubmitting(true);
    setFeedback("");
    setIsErrorFeedback(false);
    try {
      setFeedback(await voteForPlayer(selectedVote));
      setParticipation((current) =>
        current ? { ...current, has_voted: true } : current,
      );
      await refreshPageData();
      setSelectedVote("");
    } catch (requestError) {
      console.error("Player vote failed:", requestError);
      setFeedback(messageFromError(requestError, "Could not submit your vote."));
      setIsErrorFeedback(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="text-[11px] font-extrabold tracking-[.16em] text-[#075aa6]">
          THE PILLARS FC AWARD
        </p>
        <h1 className="mt-2 font-condensed text-6xl font-black uppercase leading-[.82] text-[#071b33] sm:text-7xl">
          Player of the Month
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
          Celebrate the players making a difference. Active registered members
          can nominate a player and vote in each open poll.
        </p>

        {error && (
          <p role="alert" className="mt-8 bg-white p-5 text-sm text-red-700">
            {error}
          </p>
        )}

        <section className="mt-10">
          <p className="text-[11px] font-extrabold tracking-[.16em] text-[#075aa6]">
            CURRENT HONOUREE
          </p>
          {isLoading ? (
            <p className="mt-4 bg-white p-8 text-sm text-slate-500" aria-live="polite">
              Loading the current honouree...
            </p>
          ) : winner ? (
            <article className="mt-4 grid overflow-hidden bg-[#071b33] text-white md:grid-cols-[minmax(0,1fr)_1fr]">
              <Image
                src={winner.image_url}
                alt={`${winner.name}, Pillars FC Player of the Month`}
                width={960}
                height={800}
                className="h-full min-h-72 w-full object-cover"
                priority
              />
              <div className="p-7 sm:p-10">
                <p className="text-xs font-extrabold tracking-[.15em] text-[#f6b71d]">
                  {winner.award_period}
                </p>
                <h2 className="mt-3 font-condensed text-5xl font-black uppercase leading-none sm:text-6xl">
                  {winner.name}
                </h2>
                <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-200">
                  {winner.description}
                </p>
              </div>
            </article>
          ) : (
            <div className="mt-4 bg-white p-8">
              <h2 className="font-condensed text-3xl font-extrabold uppercase text-[#071b33]">
                The first Player of the Month is coming soon
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Check back after the club completes its first member poll.
              </p>
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-extrabold tracking-[.16em] text-[#075aa6]">
                MEMBER PARTICIPATION
              </p>
              <h2 className="mt-2 font-condensed text-4xl font-black uppercase text-[#071b33] sm:text-5xl">
                Nominations &amp; voting
              </h2>
            </div>
            <Link
              href="/admin/player-of-the-month"
              className="w-fit text-xs font-extrabold tracking-wider text-[#075aa6]"
            >
              CLUB ADMIN
            </Link>
          </div>

          {isLoading ? (
            <p className="mt-5 bg-white p-8 text-sm text-slate-500" aria-live="polite">
              Checking for an open round...
            </p>
          ) : !round ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
              <p className="bg-white p-8 text-sm leading-6 text-slate-500">
                There is no open nomination round or poll right now. Please
                check back soon.
              </p>
              <aside className="bg-[#071b33] p-6 text-white sm:p-8">
                {member ? (
                  <>
                    <p className="text-[10px] font-extrabold tracking-[.16em] text-[#f6b71d]">
                      VERIFIED MEMBER
                    </p>
                    <h3 className="mt-2 font-condensed text-3xl font-extrabold uppercase">
                      {member.name}
                    </h3>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isSubmitting}
                      className="mt-5 border border-white/30 px-4 py-3 text-xs font-extrabold disabled:opacity-50"
                    >
                      SIGN OUT
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-extrabold tracking-[.16em] text-[#f6b71d]">
                      REGISTERED MEMBERS
                    </p>
                    <h3 className="mt-2 font-condensed text-3xl font-extrabold uppercase">
                      {authMode === "login" ? "Member sign in" : "Activate your account"}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {authMode === "login"
                        ? "Sign in with your verified member account."
                        : "Enter the email already registered with the club and set a password. We will email you a verification link; verify your email before signing in."}
                    </p>
                    {authUnavailable ? (
                      <p role="alert" className="mt-4 text-sm text-amber-200">
                        Member sign-in is unavailable. Please try again later.
                      </p>
                    ) : (
                      <form onSubmit={handleMemberAccess} className="mt-5 grid gap-4">
                        <label>
                          <span className="text-[10px] font-extrabold tracking-wider text-white">
                            MEMBER EMAIL
                          </span>
                          <input
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            maxLength={254}
                            className="mt-2 w-full border border-white/20 bg-white p-3 text-sm text-[#071b33] outline-none focus:border-[#f6b71d]"
                          />
                        </label>
                        <label>
                          <span className="text-[10px] font-extrabold tracking-wider text-white">
                            {authMode === "login" ? "PASSWORD" : "SET PASSWORD"}
                          </span>
                          <input
                            type="password"
                            autoComplete={
                              authMode === "login" ? "current-password" : "new-password"
                            }
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            minLength={authMode === "register" ? 6 : 1}
                            maxLength={128}
                            className="mt-2 w-full border border-white/20 bg-white p-3 text-sm text-[#071b33] outline-none focus:border-[#f6b71d]"
                          />
                          {authMode === "register" && (
                            <span className="mt-1 block text-xs text-slate-300">
                              Create a password with at least 6 characters. After
                              you verify your email, use it to sign in.
                            </span>
                          )}
                        </label>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-fit bg-[#f6b71d] px-5 py-3 text-xs font-extrabold text-[#152238] disabled:opacity-50"
                        >
                          {isSubmitting
                            ? "PLEASE WAIT..."
                            : authMode === "login"
                              ? "SIGN IN"
                              : "CREATE ACCOUNT & SEND LINK"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode((mode) =>
                              mode === "login" ? "register" : "login",
                            );
                            setFeedback("");
                            setIsErrorFeedback(false);
                          }}
                          className="w-fit text-left text-xs font-bold text-[#f6b71d] underline underline-offset-4"
                        >
                          {authMode === "login"
                            ? "First time here? Activate an account"
                            : "Already activated? Sign in"}
                        </button>
                      </form>
                    )}
                  </>
                )}
                {feedback && (
                  <p
                    role={isErrorFeedback ? "alert" : "status"}
                    className={`mt-4 text-sm ${
                      isErrorFeedback ? "text-red-200" : "text-emerald-200"
                    }`}
                  >
                    {feedback}
                  </p>
                )}
              </aside>
            </div>
          ) : (
            <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
              <div className="bg-white p-6 sm:p-8">
                <p className="text-xs font-extrabold tracking-wider text-[#075aa6]">
                  {round.award_period} ·{" "}
                  {round.phase === "nominations" ? "NOMINATIONS OPEN" : "VOTING OPEN"}
                </p>
                {round.phase === "nominations" ? (
                  <>
                    <h3 className="mt-3 font-condensed text-3xl font-extrabold uppercase text-[#071b33]">
                      Nominate one player
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      The four players with the most member nominations will
                      advance to the poll.
                    </p>
                    {member ? (
                      participation?.has_nominated ? (
                        <p className="mt-5 border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm text-emerald-800">
                          Your nomination has been recorded for this round.
                        </p>
                      ) : (
                        <form onSubmit={handleNomination} className="mt-5">
                          <label className="block">
                            <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                              SEARCH ACTIVE MEMBERS
                            </span>
                            <input
                              value={memberSearch}
                              onChange={(event) => setMemberSearch(event.target.value)}
                              placeholder="Type a player name"
                              className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                            />
                          </label>
                          <div className="mt-3 max-h-72 divide-y divide-slate-200 overflow-y-auto border-y border-slate-200">
                            {members.length === 0 ? (
                              <p className="p-4 text-sm text-slate-500">
                                No active members match this search.
                              </p>
                            ) : (
                              members.map((candidate) => (
                                <label
                                  key={candidate.membership_id}
                                  className="flex cursor-pointer items-center gap-3 p-3 hover:bg-slate-50"
                                >
                                  <input
                                    type="radio"
                                    name="nominee"
                                    value={candidate.membership_id}
                                    checked={selectedNominee === candidate.membership_id}
                                    onChange={() => setSelectedNominee(candidate.membership_id)}
                                  />
                                  {candidate.image_url ? (
                                    <Image
                                      src={candidate.image_url}
                                      alt=""
                                      width={40}
                                      height={40}
                                      className="h-10 w-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-xs font-extrabold text-[#075aa6]">
                                      {candidate.name.slice(0, 1).toUpperCase()}
                                    </span>
                                  )}
                                  <span>
                                    <span className="block text-sm font-bold text-[#071b33]">
                                      {candidate.name}
                                    </span>
                                    {candidate.preferred_position && (
                                      <span className="text-xs text-slate-500">
                                        {candidate.preferred_position}
                                      </span>
                                    )}
                                  </span>
                                </label>
                              ))
                            )}
                          </div>
                          <button
                            type="submit"
                            disabled={isSubmitting || !selectedNominee}
                            className="mt-4 bg-[#f6b71d] px-5 py-3 text-xs font-extrabold text-[#152238] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSubmitting ? "SUBMITTING..." : "SUBMIT NOMINATION"}
                          </button>
                        </form>
                      )
                    ) : null}
                  </>
                ) : (
                  <>
                    <h3 className="mt-3 font-condensed text-3xl font-extrabold uppercase text-[#071b33]">
                      Cast your vote
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Choose one of the four nominees. Vote totals are kept
                      private until the poll closes.
                    </p>
                    <form onSubmit={handleVote} className="mt-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {round.candidates.map((candidate) => (
                          <label
                            key={candidate.membership_id}
                            className={`cursor-pointer border p-3 ${
                              selectedVote === candidate.membership_id
                                ? "border-[#075aa6] bg-blue-50"
                                : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="candidate"
                                value={candidate.membership_id}
                                checked={selectedVote === candidate.membership_id}
                                onChange={() => setSelectedVote(candidate.membership_id)}
                              />
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
                              <span>
                                <span className="block font-bold text-[#071b33]">
                                  {candidate.name}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {candidate.nomination_count}{" "}
                                  {candidate.nomination_count === 1
                                    ? "nomination"
                                    : "nominations"}
                                </span>
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      {member ? (
                        participation?.has_voted ? (
                          <p className="mt-4 border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm text-emerald-800">
                            Your vote has been recorded for this poll.
                          </p>
                        ) : (
                          <button
                            type="submit"
                            disabled={isSubmitting || !selectedVote}
                            className="mt-4 bg-[#f6b71d] px-5 py-3 text-xs font-extrabold text-[#152238] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSubmitting ? "SUBMITTING..." : "SUBMIT VOTE"}
                          </button>
                        )
                      ) : null}
                    </form>
                  </>
                )}
              </div>

              <aside className="bg-[#071b33] p-6 text-white sm:p-8">
                {member ? (
                  <>
                    <p className="text-[10px] font-extrabold tracking-[.16em] text-[#f6b71d]">
                      VERIFIED MEMBER
                    </p>
                    <h3 className="mt-2 font-condensed text-3xl font-extrabold uppercase">
                      {member.name}
                    </h3>
                    <p className="mt-2 font-mono text-xs text-slate-300">
                      {member.membership_id}
                    </p>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isSubmitting}
                      className="mt-5 border border-white/30 px-4 py-3 text-xs font-extrabold disabled:opacity-50"
                    >
                      SIGN OUT
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-extrabold tracking-[.16em] text-[#f6b71d]">
                      MEMBERS ONLY
                    </p>
                    <h3 className="mt-2 font-condensed text-3xl font-extrabold uppercase">
                      {authMode === "login" ? "Member sign in" : "Activate your account"}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {authMode === "login"
                        ? "Sign in with your verified account to nominate or vote."
                        : "Use the email already registered with the club and set a password. We will email you a verification link; verify your email before signing in."}
                    </p>
                    {authUnavailable ? (
                      <p role="alert" className="mt-4 text-sm text-amber-200">
                        Member sign-in is unavailable. Please try again later.
                      </p>
                    ) : (
                      <form onSubmit={handleMemberAccess} className="mt-5 grid gap-4">
                        <label>
                          <span className="text-[10px] font-extrabold tracking-wider text-white">
                            MEMBER EMAIL
                          </span>
                          <input
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            maxLength={254}
                            className="mt-2 w-full border border-white/20 bg-white p-3 text-sm text-[#071b33] outline-none focus:border-[#f6b71d]"
                          />
                        </label>
                        <label>
                          <span className="text-[10px] font-extrabold tracking-wider text-white">
                            {authMode === "login" ? "PASSWORD" : "SET PASSWORD"}
                          </span>
                          <input
                            type="password"
                            autoComplete={
                              authMode === "login" ? "current-password" : "new-password"
                            }
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            minLength={authMode === "register" ? 6 : 1}
                            maxLength={128}
                            className="mt-2 w-full border border-white/20 bg-white p-3 text-sm text-[#071b33] outline-none focus:border-[#f6b71d]"
                          />
                          {authMode === "register" && (
                            <span className="mt-1 block text-xs text-slate-300">
                              This becomes your sign-in password. Use at least 6
                              characters; you can sign in after email verification.
                            </span>
                          )}
                        </label>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-fit bg-[#f6b71d] px-5 py-3 text-xs font-extrabold text-[#152238] disabled:opacity-50"
                        >
                          {isSubmitting
                            ? "PLEASE WAIT..."
                            : authMode === "login"
                              ? "SIGN IN"
                              : "CREATE ACCOUNT & SEND LINK"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode((mode) =>
                              mode === "login" ? "register" : "login",
                            );
                            setFeedback("");
                            setIsErrorFeedback(false);
                          }}
                          className="w-fit text-left text-xs font-bold text-[#f6b71d] underline underline-offset-4"
                        >
                          {authMode === "login"
                            ? "First time here? Activate an account"
                            : "Already activated? Sign in"}
                        </button>
                      </form>
                    )}
                  </>
                )}
                {feedback && (
                  <p
                    role={isErrorFeedback ? "alert" : "status"}
                    className={`mt-4 text-sm ${
                      isErrorFeedback ? "text-red-200" : "text-emerald-200"
                    }`}
                  >
                    {feedback}
                  </p>
                )}
                <p className="mt-5 text-xs leading-5 text-slate-300">
                  Not yet a member?{" "}
                  <Link href="/join" className="font-bold text-[#f6b71d] underline">
                    Apply to join the club
                  </Link>
                  .
                </p>
              </aside>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
