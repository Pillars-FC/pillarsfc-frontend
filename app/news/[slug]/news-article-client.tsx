"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import MarkdownContent from "../../components/MarkdownContent";
import Navbar from "../../components/Navbar";
import { getNewsArticle, type NewsArticle } from "../../lib/news";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function NewsArticleClient({ slug }: { slug: string }) {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getNewsArticle(slug, controller.signal)
      .then(setArticle)
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load news article:", requestError);
        setError(
          axios.isAxiosError(requestError) && requestError.response?.status === 404
            ? "This news article could not be found."
            : "This news article is unavailable right now.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  return (
    <>
      <Navbar />
      {isLoading ? (
        <main className="mx-auto max-w-4xl px-6 py-20">
          <p className="bg-white p-8 text-center text-sm text-slate-500" aria-live="polite">
            Loading article...
          </p>
        </main>
      ) : error || !article ? (
        <main className="mx-auto max-w-4xl px-6 py-20">
          <section className="bg-white p-8 text-center">
            <p role="alert" className="text-sm text-red-700">
              {error || "This news article could not be found."}
            </p>
            <Link
              href="/news"
              className="mt-6 inline-block bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white"
            >
              VIEW ALL NEWS
            </Link>
          </section>
        </main>
      ) : (
        <main>
          <section className="bg-[#071b33] px-6 py-16 text-white sm:py-20">
            <div className="mx-auto max-w-4xl">
              <Link
                href="/news"
                className="text-xs font-extrabold tracking-wider text-[#f6b71d]"
              >
                ← ALL NEWS
              </Link>
              <p className="mt-10 text-[11px] font-extrabold tracking-[.16em] text-[#f6b71d]">
                {article.category}
              </p>
              <h1 className="mt-3 font-condensed text-5xl font-black uppercase leading-[.85] sm:text-7xl">
                {article.title}
              </h1>
              <p className="mt-6 text-sm text-slate-300">
                {formatDate(article.published_at)}
              </p>
            </div>
          </section>
          <div className="relative h-[300px] sm:h-[470px]">
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <article className="mx-auto max-w-3xl px-6 py-14">
            <p className="mb-8 text-xl leading-8 text-[#071b33]">
              {article.summary}
            </p>
            <div className="text-[17px] leading-8 text-slate-600">
              <MarkdownContent content={article.content} />
            </div>
            {article.gallery.length > 0 && (
              <section className="mt-12">
                <h2 className="font-condensed text-4xl font-black uppercase text-[#071b33]">
                  Photo gallery
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {article.gallery.map((image, index) => (
                    <a
                      key={`${image.url}-${index}`}
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block aspect-[4/3] overflow-hidden bg-slate-100"
                    >
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover transition duration-300 hover:scale-[1.02]"
                      />
                    </a>
                  ))}
                </div>
              </section>
            )}
            <Link
              href="/news"
              className="mt-10 inline-block bg-[#f6b71d] px-5 py-3 text-xs font-extrabold text-[#152238]"
            >
              BACK TO ALL NEWS
            </Link>
          </article>
        </main>
      )}
    </>
  );
}
