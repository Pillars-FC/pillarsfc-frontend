"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import Navbar from "../../components/Navbar";
import { getAdminSession } from "../../lib/admin";
import {
  getMember,
  registerMemberYear,
  type MemberDetail,
} from "../../lib/members";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function MemberDetailClient({
  membershipId,
}: {
  membershipId: string;
}) {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckError, setAdminCheckError] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [registrationError, setRegistrationError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getMember(membershipId, controller.signal)
      .then(setMember)
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load member profile:", requestError);
        setError(
          axios.isAxiosError(requestError) && requestError.response?.status === 404
            ? "This member could not be found."
            : "The member profile is unavailable right now.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [membershipId]);

  useEffect(() => {
    let isMounted = true;
    getAdminSession().then(
      () => {
        if (isMounted) setIsAdmin(true);
      },
      (requestError: unknown) => {
        if (
          isMounted &&
          !(axios.isAxiosError(requestError) && requestError.response?.status === 401)
        ) {
          console.error("Failed to check admin session:", requestError);
          setAdminCheckError(true);
        }
      },
    );
    return () => {
      isMounted = false;
    };
  }, []);

  const joinedYear = member ? Number(member.joined_at.slice(0, 4)) : 0;
  const currentYear = new Date().getUTCFullYear();
  const registrationsByYear = new Map(
    member?.registrations.map((registration) => [
      registration.year,
      registration,
    ]) ?? [],
  );
  const registrationYears = Array.from(
    { length: Math.max(0, currentYear - joinedYear + 1) },
    (_, index) => currentYear - index,
  ).filter((year) => year >= joinedYear);
  const unregisteredYears = registrationYears.filter(
    (year) => !registrationsByYear.has(year),
  );

  const handleRegisterYear = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedYear) return;

    setIsRegistering(true);
    setRegistrationMessage("");
    setRegistrationError(false);
    try {
      const updatedMember = await registerMemberYear(
        membershipId,
        Number(selectedYear),
      );
      setMember(updatedMember);
      setRegistrationMessage(`${selectedYear} registration recorded.`);
      setSelectedYear("");
    } catch (requestError) {
      console.error("Failed to record member registration:", requestError);
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        setIsAdmin(false);
        setRegistrationMessage("Your admin session expired. Sign in again to continue.");
      } else if (axios.isAxiosError(requestError) && requestError.response?.status === 409) {
        setRegistrationMessage("That year's registration is already recorded.");
      } else {
        setRegistrationMessage("Could not record this registration. Please try again.");
      }
      setRegistrationError(true);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <Link
          href="/members"
          className="text-xs font-extrabold tracking-wider text-[#075aa6]"
        >
          &larr; ALL MEMBERS
        </Link>

        {error ? (
          <div className="mt-8 bg-white p-8 text-center">
            <p role="alert" className="text-sm text-red-700">{error}</p>
          </div>
        ) : isLoading || !member ? (
          <p className="mt-8 bg-white p-8 text-center text-sm text-slate-500" aria-live="polite">
            Loading member profile...
          </p>
        ) : (
          <>
            <section className="mt-8 bg-[#071b33] p-7 text-white sm:p-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <span className="grid h-28 w-28 place-items-center rounded-full bg-white/10 font-condensed text-4xl font-black text-[#f6b71d]">
                  {member.name
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div>
                  <p className="text-[11px] font-extrabold tracking-[.16em] text-[#f6b71d]">
                    MEMBER PROFILE
                  </p>
                  <h1 className="mt-2 font-condensed text-5xl font-black uppercase sm:text-6xl">
                    {member.name}
                  </h1>
                  <p className="mt-3 font-mono text-sm text-slate-300">
                    {member.membership_id}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 bg-white p-6 sm:p-8">
              <h2 className="font-condensed text-3xl font-black uppercase text-[#071b33]">
                Member photo
              </h2>
              {member.image_url ? (
                <a
                  href={member.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex flex-col gap-2 text-sm font-bold text-[#075aa6] hover:underline"
                >
                  <Image
                    src={member.image_url}
                    alt={`${member.name} member photo`}
                    width={640}
                    height={640}
                    className="max-h-120 w-full max-w-120 rounded-lg object-contain"
                  />
                  View full-size photo
                </a>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No profile photo was uploaded.
                </p>
              )}
            </section>

            <section className="mt-6 grid gap-px bg-slate-200 sm:grid-cols-3">
              <div className="bg-white p-6">
                <p className="text-[10px] font-extrabold tracking-wider text-slate-500">
                  PREFERRED POSITION
                </p>
                <p className="mt-2 font-bold text-[#071b33]">
                  {member.preferred_position ?? "Not specified"}
                </p>
              </div>
              <div className="bg-white p-6">
                <p className="text-[10px] font-extrabold tracking-wider text-slate-500">
                  MEMBER SINCE
                </p>
                <p className="mt-2 font-bold text-[#071b33]">
                  {formatDate(member.joined_at)}
                </p>
              </div>
              <div className="bg-white p-6">
                <p className="text-[10px] font-extrabold tracking-wider text-slate-500">
                  MEMBERSHIP STATUS
                </p>
                <p className="mt-2 font-bold capitalize text-[#071b33]">
                  {member.status}
                </p>
              </div>
            </section>

            <section className="mt-8 bg-white p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[11px] font-extrabold tracking-[.16em] text-[#075aa6]">
                    YEAR BY YEAR
                  </p>
                  <h2 className="mt-2 font-condensed text-4xl font-black uppercase text-[#071b33]">
                    Registration history
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  A year is marked registered when the club records its renewal.
                </p>
              </div>

              {isAdmin && unregisteredYears.length > 0 && (
                <form
                  onSubmit={handleRegisterYear}
                  className="mt-6 flex flex-col gap-3 border border-slate-200 p-4 sm:flex-row sm:items-end"
                >
                  <label className="flex-1">
                    <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                      RECORD A REGISTRATION
                    </span>
                    <select
                      value={selectedYear}
                      onChange={(event) => setSelectedYear(event.target.value)}
                      required
                      className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                    >
                      <option value="">Select a year</option>
                      {unregisteredYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    disabled={isRegistering || !selectedYear}
                    className="bg-[#f6b71d] px-5 py-3 text-xs font-extrabold text-[#152238] disabled:cursor-wait disabled:opacity-50"
                  >
                    {isRegistering ? "SAVING..." : "RECORD YEAR"}
                  </button>
                </form>
              )}

              {adminCheckError && (
                <p role="alert" className="mt-4 text-sm text-amber-700">
                  Admin controls could not be verified. Reload the page to try again.
                </p>
              )}
              {registrationMessage && (
                <p
                  role={registrationError ? "alert" : "status"}
                  className={`mt-4 text-sm ${registrationError ? "text-red-700" : "text-green-700"}`}
                >
                  {registrationMessage}
                </p>
              )}

              <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                {registrationYears.length === 0 ? (
                  <p className="py-5 text-sm text-slate-500">
                    No registration years are available for this member yet.
                  </p>
                ) : (
                  registrationYears.map((year) => {
                    const registration = registrationsByYear.get(year);
                    return (
                      <div
                        key={year}
                        className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center"
                      >
                        <span className="font-bold text-[#071b33]">{year}</span>
                        {registration ? (
                          <span className="text-sm text-emerald-700">
                            Registered on {formatDate(registration.registered_at)}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500">
                            Not recorded
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
