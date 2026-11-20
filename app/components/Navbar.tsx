"use client";

import Link from "next/link";
import { useState } from "react";
import ComingSoonButton from "./ComingSoonButton";

const links = [
  { label: "Home", href: "/" },
  { label: "News", href: "/news" },
  { label: "Shop", href: "/#shop" },
  { label: "Quiz", href: "/quiz" },
  { label: "Player of the Month", href: "/player-of-the-month" },
  { label: "Executives", href: "/executives" },
  { label: "Contact", href: "/contact" },
  { label: "Members", href: "/members" },
];

export function Crest() {
  return (
    <img
      src="/pillars-logo.jpg"
      alt="Pillars FC crest"
      className="h-12 w-10 shrink-0 rounded-sm object-cover object-center"
    />
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <nav className="mx-auto flex h-20.5 max-w-360 items-center px-5 sm:px-8 lg:px-[5.5%]">
        <Link
          href="/"
          className="flex items-center gap-3 font-condensed text-2xl font-extrabold leading-[.78] text-[#071b33]"
        >
          <Crest />
          <span>
            Pillars
            <br />
            Football Club
          </span>
        </Link>
        <div className="ml-auto hidden items-center gap-6 text-sm font-bold lg:flex">
          {links.map((link) =>
            link.label === "Shop" ? (
              <ComingSoonButton
                key={link.label}
                className="transition hover:text-[#075aa6]"
              >
                {link.label}
              </ComingSoonButton>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="transition hover:text-[#075aa6]"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="ml-auto grid h-11 w-11 place-items-center bg-[#071b33] text-2xl text-white lg:hidden"
        >
          {open ? "×" : "☰"}
        </button>
      </nav>
      {open && (
        <div className="border-t border-white/10 bg-[#071b33] px-6 pb-5 lg:hidden">
          {links.map((link) =>
            link.label === "Shop" ? (
              <ComingSoonButton
                key={link.label}
                onClose={() => setOpen(false)}
                className="block w-full border-b border-white/10 py-3.5 text-left text-sm font-bold text-white"
              >
                {link.label}
              </ComingSoonButton>
            ) : (
              <Link
                onClick={() => setOpen(false)}
                key={link.label}
                href={link.href}
                className="block border-b border-white/10 py-3.5 text-sm font-bold text-white last:border-0 last:text-[#f6b71d]"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>
      )}
    </header>
  );
}
