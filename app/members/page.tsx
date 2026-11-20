"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getMembers, type Member } from "../lib/members";

const pageSize = 10;

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getMembers(
      { skip: page * pageSize, limit: pageSize, search: search || undefined },
      controller.signal,
    )
      .then((response) => {
        setMembers(response.data);
        setTotal(response.total);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load members:", requestError);
        setError("The member directory is unavailable right now.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [page, reloadKey, search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      if (nextSearch === search) return;
      setPage(0);
      setIsLoading(true);
      setError(null);
      setSearch(nextSearch);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search, searchInput]);

  const retryLoading = () => {
    setError(null);
    setIsLoading(true);
    setReloadKey((currentKey) => currentKey + 1);
  };

  const totalPages = Math.ceil(total / pageSize);
  const first = total === 0 ? 0 : page * pageSize + 1;
  const last = Math.min((page + 1) * pageSize, total);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-280 px-6 py-16 sm:py-20">
        <p className="text-[11px] font-extrabold tracking-[.16em] text-[#075aa6]">
          CLUB ADMINISTRATION
        </p>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h1 className="font-condensed text-6xl font-black uppercase leading-[.8] text-[#071b33] sm:text-7xl">
            Registered
            <br />
            Members
          </h1>
          <div className="sm:text-right">
            <p className="text-sm leading-6 text-slate-500">
              {total.toLocaleString()} registered {total === 1 ? "member" : "members"}
            </p>
            <Link
              href="/join"
              className="mt-4 inline-block bg-[#f6b71d] px-5 py-3 text-xs font-extrabold text-[#152238]"
            >
              BECOME A MEMBER
            </Link>
          </div>
        </div>

        <section className="mt-9 bg-[#071b33] p-6 text-white sm:p-8">
          <strong className="block font-condensed text-5xl font-extrabold leading-none">
            {total.toLocaleString()}
          </strong>
          <span className="mt-2 block text-[10px] font-bold tracking-wider">
            TOTAL REGISTERED MEMBERS
          </span>
        </section>

        <section className="mt-7 bg-white">
          <div
            className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <input
              type="search"
              aria-label="Search members"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by member name or ID"
              className="border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#075aa6] sm:w-80"
            />
            <Link
              href="/admin/members"
              className="w-fit border border-slate-200 px-4 py-3 text-xs font-extrabold text-[#075aa6]"
            >
              ADMIN
            </Link>
          </div>

          {error ? (
            <div className="p-8 text-center">
              <p role="alert" className="text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={retryLoading}
                className="mt-4 bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white"
              >
                TRY AGAIN
              </button>
            </div>
          ) : isLoading ? (
            <p className="p-8 text-center text-sm text-slate-500" aria-live="polite">
              Loading members...
            </p>
          ) : members.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              {search ? "No members match your search." : "No members have been added yet."}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-175 border-collapse text-left">
                  <thead className="bg-[#071b33] text-[11px] tracking-wider text-white">
                    <tr>
                      {[
                        "MEMBER",
                        "MEMBERSHIP ID",
                        "PREFERRED POSITION",
                        "JOINED",
                        "STATUS",
                      ].map(
                        (heading) => (
                          <th key={heading} className="px-5 py-4">
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr
                        key={member.membership_id}
                        className="border-b border-slate-200 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 font-bold">
                            {member.image_url ? (
                              <Image
                                src={member.image_url}
                                alt={`${member.name} profile`}
                                width={36}
                                height={36}
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-xs font-extrabold text-[#075aa6]">
                                {member.name
                                  .split(/\s+/)
                                  .map((part) => part[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            )}
                            <Link
                              href={`/members/${encodeURIComponent(member.membership_id)}`}
                              aria-label={`View ${member.name}'s profile`}
                              className="underline decoration-slate-300 underline-offset-4 hover:text-[#075aa6]"
                            >
                              {member.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-sm text-slate-500">
                          {member.membership_id}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          {member.preferred_position ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          {new Date(member.joined_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-extrabold text-emerald-700">
                            {member.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Showing <strong className="text-[#071b33]">{first}-{last}</strong> of{" "}
                  {total} members
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoading(true);
                      setPage((currentPage) => currentPage - 1);
                    }}
                    disabled={page === 0 || isLoading}
                    className="border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40"
                  >
                    PREVIOUS
                  </button>
                  <span className="text-xs text-slate-500">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoading(true);
                      setPage((currentPage) => currentPage + 1);
                    }}
                    disabled={page + 1 >= totalPages || isLoading}
                    className="border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40"
                  >
                    NEXT
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}
