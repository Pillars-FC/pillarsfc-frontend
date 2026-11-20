"use client";

import axios from "axios";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Crest } from "./Navbar";
import { subscribeToClubEvents } from "../lib/event-subscriptions";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [hasError, setHasError] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback("");
    setHasError(false);
    try {
      const response = await subscribeToClubEvents(email);
      setFeedback(response.message);
      setEmail("");
    } catch (error) {
      console.error("Failed to subscribe to club event updates:", error);
      setFeedback(
        axios.isAxiosError(error) && error.response?.status === 429
          ? "Too many attempts. Please wait a minute and try again."
          : "Could not save your subscription. Please try again.",
      );
      setHasError(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <footer className="bg-[#031326] px-6 py-14 text-slate-300 sm:px-[7%]">
      <div className="mx-auto grid max-w-325 gap-10 lg:grid-cols-[1.4fr_.8fr_.8fr_1.25fr]">
        <div>
          <Link
            href="/"
            className="flex items-center gap-3 font-condensed text-2xl font-extrabold text-white"
          >
            <Crest />
            Pillars Football Club
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-6">
            Our home. Our club. Our city. A modern digital home for the Pillars family around the
            world.
          </p>
          <div className="mt-6 flex gap-2">
            <a
              href="https://facebook.com"
              aria-label="Facebook"
              target="_blank"
              rel="noreferrer"
              className="grid h-9 w-9 place-items-center border border-white/20 text-sm font-bold transition hover:border-[#f6b71d] hover:text-[#f6b71d]"
            >
              f
            </a>
            <a
              href="https://instagram.com"
              aria-label="Instagram"
              target="_blank"
              rel="noreferrer"
              className="grid h-9 w-9 place-items-center border border-white/20 text-sm font-bold transition hover:border-[#f6b71d] hover:text-[#f6b71d]"
            >
              ◎
            </a>
            <a
              href="https://x.com"
              aria-label="X"
              target="_blank"
              rel="noreferrer"
              className="grid h-9 w-9 place-items-center border border-white/20 text-sm font-bold transition hover:border-[#f6b71d] hover:text-[#f6b71d]"
            >
              𝕏
            </a>
          </div>
        </div>
        <FooterGroup
          title="Explore"
          links={[
            ["Latest News", "/news"],
            ["Club Executives", "/executives"],
            ["Members", "/members"],
            ["Club Quiz", "/quiz"],
          ]}
        />
        <div>
          <h2 className="font-condensed text-xl font-bold uppercase text-[#f6b71d]">
            Get in touch
          </h2>
          <a
            href="mailto:hello@pillarsfc.ng"
            className="mt-4 block text-sm transition hover:text-white"
          >
            hello@pillarsfc.ng
          </a>
          <a href="tel:+2348000000000" className="mt-2 block text-sm transition hover:text-white">
            +234 (0) 800 000 0000
          </a>
          <Link
            href="/contact"
            className="mt-4 inline-block text-xs font-extrabold tracking-wider text-[#f6b71d] hover:text-white"
          >
            CONTACT US →
          </Link>
        </div>
        <div>
          <h2 className="font-condensed text-xl font-bold uppercase text-[#f6b71d]">
            Club event updates
          </h2>
          <p className="mt-3 text-sm leading-6">
            Get club event announcements and updates straight to your inbox.
          </p>
          <form onSubmit={submit} className="mt-5 flex">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              maxLength={254}
              autoComplete="email"
              placeholder="Your email address"
              className="min-w-0 flex-1 bg-white px-3 py-3 text-sm text-[#071b33] outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#f6b71d] px-4 text-xs font-extrabold text-[#152238] disabled:cursor-wait disabled:opacity-50"
            >
              {isSubmitting ? "..." : "JOIN"}
            </button>
          </form>
          {feedback && (
            <p
              role={hasError ? "alert" : "status"}
              className={`mt-3 text-sm ${hasError ? "text-red-300" : "text-emerald-300"}`}
            >
              {feedback}
            </p>
          )}
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-325 flex-col gap-3 border-t border-white/10 pt-5 text-xs text-slate-500 sm:flex-row sm:justify-between">
        <span>© 2026 Pillars Football Club. All rights reserved.</span>
        <div className="flex gap-5">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <Link href="/contact">Support</Link>
        </div>
      </div>
    </footer>
  );
}
function FooterGroup({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="font-condensed text-xl font-bold uppercase text-[#f6b71d]">{title}</h2>
      {links.map(([label, href]) => (
        <Link key={label} href={href} className="mt-3 block text-sm transition hover:text-white">
          {label}
        </Link>
      ))}
    </div>
  );
}
