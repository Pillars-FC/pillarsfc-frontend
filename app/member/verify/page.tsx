"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { verifyMemberEmail } from "../../lib/member-auth";

export default function VerifyMemberPage() {
  const [message, setMessage] = useState("Verifying your email...");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    const verification = token
      ? verifyMemberEmail(token)
      : Promise.reject(new Error("Missing activation token"));
    verification
      .then((result) => setMessage(result.message))
      .catch((error: unknown) => {
        console.error("Member email verification failed:", error);
        setMessage(
          token
            ? "This activation link is invalid or has expired. Request a new one from the Player of the Month page."
            : "This activation link is missing its verification token.",
        );
        setIsError(true);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-20">
        <section className="bg-white p-8 text-center shadow-[0_6px_26px_rgba(13,35,50,.06)] sm:p-12">
          <p className="text-[11px] font-extrabold tracking-[.16em] text-[#075aa6]">
            MEMBER ACCOUNT
          </p>
          <h1 className="mt-2 font-condensed text-5xl font-black uppercase text-[#071b33]">
            Email verification
          </h1>
          <p
            role={isError ? "alert" : isLoading ? "status" : "status"}
            className={`mt-5 text-sm leading-6 ${
              isError ? "text-red-700" : "text-slate-600"
            }`}
          >
            {message}
          </p>
          <Link
            href="/player-of-the-month"
            className="mt-7 inline-block bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white"
          >
            GO TO PLAYER OF THE MONTH
          </Link>
        </section>
      </main>
    </>
  );
}
