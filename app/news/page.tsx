"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getNews, type NewsCard } from "../lib/news";

const pageSize = 12;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsCard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getNews({ skip: page * pageSize, limit: pageSize }, controller.signal)
      .then((response) => {
        setArticles(response.data);
        setTotal(response.total);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load news articles:", requestError);
        setError("News is unavailable right now. Please try again later.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-310 px-6 py-16 sm:py-20">
        <p className="text-[11px] font-extrabold tracking-[.16em] text-[#075aa6]">
          FROM THE CLUB
        </p>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h1 className="font-condensed text-6xl font-black uppercase leading-[.8] text-[#071b33] sm:text-7xl">
            Latest News
          </h1>
          <p className="text-sm text-slate-500">
            Stories, updates and moments from Pillars FC.
          </p>
        </div>

        {error ? (
          <p role="alert" className="mt-10 bg-white p-8 text-center text-sm text-red-700">
            {error}
          </p>
        ) : isLoading ? (
          <p className="mt-10 bg-white p-8 text-center text-sm text-slate-500" aria-live="polite">
            Loading news...
          </p>
        ) : articles.length === 0 ? (
          <p className="mt-10 bg-white p-8 text-center text-sm text-slate-500">
            No news has been published yet. Please check back soon.
          </p>
        ) : (
          <>
            <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <article
                  key={article.slug}
                  className="overflow-hidden bg-white shadow-[0_6px_26px_rgba(13,35,50,.06)]"
                >
                  <Link
                    href={`/news/${encodeURIComponent(article.slug)}`}
                    className="group block"
                    aria-label={`Read ${article.title}`}
                  >
                    <div className="relative h-52">
                      <Image
                        src={article.cover_image_url}
                        alt={article.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="p-6">
                      <p className="text-[10px] font-extrabold tracking-[.14em] text-[#075aa6]">
                        {article.category}
                      </p>
                      <h2 className="mt-2 font-condensed text-3xl font-extrabold uppercase leading-[.92] text-[#071b33]">
                        {article.title}
                      </h2>
                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        {article.summary}
                      </p>
                      <p className="mt-5 text-[10px] font-bold tracking-wider text-slate-500">
                        {formatDate(article.published_at)}
                      </p>
                      <span className="mt-5 inline-block text-xs font-extrabold tracking-wider text-[#075aa6]">
                        READ MORE →
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </section>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between bg-white p-4">
                <p className="text-xs text-slate-500">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoading(true);
                      setError("");
                      setPage((current) => current - 1);
                    }}
                    disabled={page === 0 || isLoading}
                    className="border border-slate-200 px-4 py-2 text-xs font-bold disabled:opacity-40"
                  >
                    PREVIOUS
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoading(true);
                      setError("");
                      setPage((current) => current + 1);
                    }}
                    disabled={page + 1 >= totalPages || isLoading}
                    className="border border-slate-200 px-4 py-2 text-xs font-bold disabled:opacity-40"
                  >
                    NEXT
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
