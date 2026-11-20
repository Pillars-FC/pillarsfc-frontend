"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import Navbar from "../../components/Navbar";
import MarkdownEditor from "../../components/MarkdownEditor";
import { getAdminSession, logoutAdmin } from "../../lib/admin";
import {
  createNewsArticle,
  getNews,
  type NewsArticle,
  type NewsCard,
} from "../../lib/news";

const maxGalleryImages = 10;
const maxImageSize = 5 * 1024 * 1024;

function requestMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (error.response?.status === 413) {
      return "Each image must be 5 MB or smaller.";
    }
    if (error.response?.status === 415) return "Use JPEG, PNG, or WebP images.";
    if (error.response?.status === 503) {
      return "News image uploads are not configured on the server.";
    }
  }
  return "Could not publish this article. Please try again.";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<NewsCard[]>([]);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("CLUB NEWS");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [coverInputKey, setCoverInputKey] = useState(0);
  const [galleryInputKey, setGalleryInputKey] = useState(0);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let isMounted = true;
    getAdminSession()
      .then(async () => {
        if (!isMounted) return;
        setIsAuthenticated(true);
        const response = await getNews({ skip: 0, limit: 20 });
        if (isMounted) setArticles(response.data);
      })
      .catch((requestError: unknown) => {
        if (!isMounted) return;
        if (
          !(axios.isAxiosError(requestError) && requestError.response?.status === 401)
        ) {
          console.error("Failed to load the news admin page:", requestError);
          setError("News administration is unavailable. Check the backend configuration.");
        }
      })
      .finally(() => {
        if (isMounted) setIsCheckingSession(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGalleryChange = (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length > maxGalleryImages) {
      setError(`Choose no more than ${maxGalleryImages} gallery images.`);
      setGalleryImages([]);
      setGalleryInputKey((key) => key + 1);
      return;
    }
    if (selected.some((file) => file.size > maxImageSize)) {
      setError("Each image must be 5 MB or smaller.");
      setGalleryImages([]);
      setGalleryInputKey((key) => key + 1);
      return;
    }
    setError("");
    setGalleryImages(selected);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!coverImage) {
      setError("Choose a cover image before publishing.");
      return;
    }
    if (coverImage.size > maxImageSize) {
      setError("The cover image must be 5 MB or smaller.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setFeedback("");
    try {
      const article: NewsArticle = await createNewsArticle({
        title,
        category,
        summary,
        content,
        coverImage,
        gallery: galleryImages,
      });
      setArticles((current) => [article, ...current].slice(0, 20));
      setTitle("");
      setCategory("CLUB NEWS");
      setSummary("");
      setContent("");
      setCoverImage(null);
      setGalleryImages([]);
      setCoverInputKey((key) => key + 1);
      setGalleryInputKey((key) => key + 1);
      setFeedback(`${article.title} has been published.`);
    } catch (requestError) {
      console.error("Failed to publish news article:", requestError);
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        setIsAuthenticated(false);
        setError("Your admin session expired. Sign in again to publish news.");
      } else {
        setError(requestMessage(requestError));
      }
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
              Manage News
            </h1>
            <p className="mt-4 text-sm text-slate-500">
              Write a story, add a cover photo and optionally include a gallery.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/news"
              className="w-fit border border-slate-200 px-4 py-3 text-xs font-extrabold text-[#075aa6]"
            >
              VIEW PUBLIC NEWS
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

        {isCheckingSession ? (
          <p className="mt-8 bg-white p-8 text-center text-sm text-slate-500" aria-live="polite">
            Checking admin session...
          </p>
        ) : !isAuthenticated ? (
          <section className="mt-8 bg-white p-8 text-center">
            <p className="text-sm text-slate-600">
              Sign in as an admin to create and publish news.
            </p>
            <Link
              href="/admin/members"
              className="mt-5 inline-block bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white"
            >
              ADMIN SIGN IN
            </Link>
          </section>
        ) : (
          <>
            <form
              onSubmit={handleSubmit}
              className="mt-8 grid gap-5 bg-white p-6 shadow-[0_6px_26px_rgba(13,35,50,.06)] sm:p-8"
            >
              <div>
                <h2 className="font-condensed text-4xl font-extrabold uppercase text-[#071b33]">
                  Create a news article
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Articles publish immediately after they are saved. Gallery
                  images are optional, up to 10 images at 5 MB each.
                </p>
              </div>
              <label>
                <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                  HEADLINE
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  minLength={3}
                  maxLength={180}
                  className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                />
              </label>
              <label>
                <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                  CATEGORY
                </span>
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                  minLength={2}
                  maxLength={50}
                  placeholder="e.g. FIRST TEAM, CLUB NEWS, ACADEMY"
                  className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                />
              </label>
              <label>
                <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                  SHORT SUMMARY
                </span>
                <textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  required
                  minLength={10}
                  maxLength={500}
                  rows={3}
                  className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                />
              </label>
              <div>
                <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                  FULL STORY
                </span>
                <p className="mt-1 mb-3 text-xs leading-5 text-slate-500">
                  Use the formatting toolbar or Markdown syntax. The live preview
                  shows how the published story will look. Raw HTML is not supported.
                </p>
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                  maxLength={30000}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  {content.length.toLocaleString()} / 30,000 characters
                </span>
              </div>
              <label>
                <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                  COVER IMAGE (REQUIRED, JPEG/PNG/WEBP, MAX 5 MB)
                </span>
                <input
                  key={coverInputKey}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  onChange={(event) =>
                    setCoverImage(event.currentTarget.files?.[0] ?? null)
                  }
                  className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:text-xs file:font-bold"
                />
              </label>
              <label>
                <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                  PHOTO GALLERY (OPTIONAL, UP TO {maxGalleryImages} IMAGES)
                </span>
                <input
                  key={galleryInputKey}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => handleGalleryChange(event.currentTarget.files)}
                  className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:text-xs file:font-bold"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  JPEG, PNG, or WebP; each image must be 5 MB or smaller.
                </span>
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-fit bg-[#f6b71d] px-6 py-4 text-xs font-extrabold text-[#152238] disabled:cursor-wait disabled:opacity-50"
              >
                {isSubmitting ? "PUBLISHING..." : "PUBLISH NEWS"}
              </button>
            </form>

            <section className="mt-10">
              <h2 className="font-condensed text-4xl font-extrabold uppercase text-[#071b33]">
                Recently published
              </h2>
              {articles.length === 0 ? (
                <p className="mt-4 bg-white p-6 text-sm text-slate-500">
                  No articles have been published yet.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-slate-200 bg-white">
                  {articles.map((article) => (
                    <article
                      key={article.slug}
                      className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                    >
                      <Image
                        src={article.cover_image_url}
                        alt=""
                        width={100}
                        height={72}
                        className="h-18 w-25 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold tracking-wider text-[#075aa6]">
                          {article.category} · {formatDate(article.published_at)}
                        </p>
                        <h3 className="mt-1 truncate font-bold text-[#071b33]">
                          {article.title}
                        </h3>
                      </div>
                      <Link
                        href={`/news/${encodeURIComponent(article.slug)}`}
                        className="text-xs font-extrabold text-[#075aa6]"
                      >
                        VIEW ARTICLE
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
