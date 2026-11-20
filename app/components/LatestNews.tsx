"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getNews, type NewsCard } from "../lib/news";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function LatestNews() {
  const [articles, setArticles] = useState<NewsCard[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    getNews({ skip: 0, limit: 3 }, controller.signal)
      .then((response) => setArticles(response.data))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load homepage news:", error);
        setHasError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  if (isLoading) {
    return (
      <p className="bg-white p-6 text-sm text-slate-500" aria-live="polite">
        Loading latest stories...
      </p>
    );
  }
  if (hasError) {
    return (
      <p className="bg-white p-6 text-sm text-slate-500">
        The latest stories are unavailable right now.
      </p>
    );
  }
  if (articles.length === 0) {
    return (
      <p className="bg-white p-6 text-sm text-slate-500">
        No news has been published yet.
      </p>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {articles.map((article, index) => (
        <article
          key={article.slug}
          className="overflow-hidden bg-white shadow-[0_6px_26px_rgba(13,35,50,.06)]"
        >
          <Link
            href={`/news/${encodeURIComponent(article.slug)}`}
            className="group block"
            aria-label={`Read ${article.title}`}
          >
            <div className={`relative ${index === 0 ? "h-72.5" : "h-47.5"}`}>
              <Image
                src={article.cover_image_url}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            </div>
            <div className="p-5">
              <p className="text-[10px] font-extrabold tracking-[.12em] text-[#075aa6]">
                {article.category}
              </p>
              <h3
                className={`mt-2 font-condensed font-extrabold uppercase leading-[.95] ${
                  index === 0 ? "text-3xl" : "text-2xl"
                }`}
              >
                {article.title}
              </h3>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                {article.summary}
              </p>
              <p className="mt-4 text-[10px] text-slate-500">
                {formatDate(article.published_at)}
              </p>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
