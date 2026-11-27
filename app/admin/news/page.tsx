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
  deleteNewsArticle,
  getNews,
  getNewsArticle,
  updateNewsArticle,
  type NewsArticle,
  type NewsCard,
} from "../../lib/news";

const maxGalleryImages = 10;
const maxImageSize = 5 * 1024 * 1024;
const pageSize = 20;

function requestMessage(
  error: unknown,
  action: "publish" | "save" | "delete",
): string {
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
  if (action === "delete") return "Could not delete this article. Please try again.";
  if (action === "save") return "Could not save this article. Please try again.";
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
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedNewsPage, setLoadedNewsPage] = useState(-1);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);
  const [busySlug, setBusySlug] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("CLUB NEWS");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [removedGalleryUrls, setRemovedGalleryUrls] = useState<string[]>([]);
  const [coverInputKey, setCoverInputKey] = useState(0);
  const [galleryInputKey, setGalleryInputKey] = useState(0);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const isLoadingNews = isAuthenticated && loadedNewsPage !== skip;

  useEffect(() => {
    let isMounted = true;
    getAdminSession()
      .then(() => {
        if (isMounted) setIsAuthenticated(true);
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

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    getNews({ skip, limit: pageSize })
      .then((response) => {
        if (!isMounted) return;
        setArticles(response.data);
        setTotal(response.total);
      })
      .catch((requestError: unknown) => {
        if (!isMounted) return;
        console.error("Failed to load published news:", requestError);
        if (
          axios.isAxiosError(requestError) &&
          requestError.response?.status === 401
        ) {
          setIsAuthenticated(false);
          setError("Your admin session expired. Sign in again to manage news.");
        } else {
          setError("Could not load published news. Please try again.");
        }
      })
      .finally(() => {
        if (isMounted) setLoadedNewsPage(skip);
      });
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, skip]);

  const handleGalleryChange = (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    const remainingExistingImages = editingArticle
      ? editingArticle.gallery.filter(
          (image) => !removedGalleryUrls.includes(image.url),
        ).length
      : 0;
    const availableSlots = maxGalleryImages - remainingExistingImages;
    if (selected.length > availableSlots) {
      setError(
        `Choose no more than ${availableSlots} additional gallery image${availableSlots === 1 ? "" : "s"}.`,
      );
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

  const resetEditor = () => {
    setEditingArticle(null);
    setTitle("");
    setCategory("CLUB NEWS");
    setSummary("");
    setContent("");
    setCoverImage(null);
    setGalleryImages([]);
    setRemovedGalleryUrls([]);
    setCoverInputKey((key) => key + 1);
    setGalleryInputKey((key) => key + 1);
  };

  const handleEdit = async (article: NewsCard) => {
    setIsLoadingArticle(true);
    setError("");
    setFeedback("");
    try {
      const fullArticle = await getNewsArticle(article.slug);
      setEditingArticle(fullArticle);
      setTitle(fullArticle.title);
      setCategory(fullArticle.category);
      setSummary(fullArticle.summary);
      setContent(fullArticle.content);
      setCoverImage(null);
      setGalleryImages([]);
      setRemovedGalleryUrls([]);
      setCoverInputKey((key) => key + 1);
      setGalleryInputKey((key) => key + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      console.error("Failed to load article for editing:", requestError);
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        setIsAuthenticated(false);
        setError("Your admin session expired. Sign in again to edit news.");
      } else {
        setError(requestMessage(requestError, "save"));
      }
    } finally {
      setIsLoadingArticle(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingArticle && !coverImage) {
      setError("Choose a cover image before publishing.");
      return;
    }
    if (coverImage && coverImage.size > maxImageSize) {
      setError("The cover image must be 5 MB or smaller.");
      return;
    }
    const remainingExistingImages = editingArticle
      ? editingArticle.gallery.filter(
          (image) => !removedGalleryUrls.includes(image.url),
        ).length
      : 0;
    if (remainingExistingImages + galleryImages.length > maxGalleryImages) {
      setError(`A news gallery can contain at most ${maxGalleryImages} images.`);
      return;
    }

    setIsSubmitting(true);
    setError("");
    setFeedback("");
    try {
      if (editingArticle) {
        const article = await updateNewsArticle(editingArticle.slug, {
          title,
          category,
          summary,
          content,
          coverImage,
          gallery: galleryImages,
          removeGalleryUrls: removedGalleryUrls,
        });
        setArticles((current) =>
          current.map((item) => (item.slug === article.slug ? article : item)),
        );
        setFeedback(`${article.title} has been updated.`);
      } else {
        if (!coverImage) {
          setError("Choose a cover image before publishing.");
          return;
        }
        const article = await createNewsArticle({
          title,
          category,
          summary,
          content,
          coverImage,
          gallery: galleryImages,
        });
        setTotal((current) => current + 1);
        setSkip(0);
        setArticles((current) => [article, ...current].slice(0, pageSize));
        setFeedback(`${article.title} has been published.`);
      }
      resetEditor();
    } catch (requestError) {
      console.error("Failed to save news article:", requestError);
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        setIsAuthenticated(false);
        setError("Your admin session expired. Sign in again to manage news.");
      } else {
        setError(requestMessage(requestError, editingArticle ? "save" : "publish"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (article: NewsCard) => {
    if (
      !window.confirm(
        `Permanently delete "${article.title}" and its cover and gallery images? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusySlug(article.slug);
    setError("");
    setFeedback("");
    try {
      await deleteNewsArticle(article.slug);
      setArticles((current) =>
        current.filter((entry) => entry.slug !== article.slug),
      );
      setTotal((current) => Math.max(0, current - 1));
      if (editingArticle?.slug === article.slug) resetEditor();
      if (skip > 0 && articles.length === 1) {
        setSkip((current) => Math.max(0, current - pageSize));
      }
      setFeedback(`"${article.title}" has been permanently deleted.`);
    } catch (requestError) {
      console.error("Failed to delete news article:", requestError);
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        setIsAuthenticated(false);
        setError("Your admin session expired. Sign in again to manage news.");
      } else {
        setError(requestMessage(requestError, "delete"));
      }
    } finally {
      setBusySlug("");
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
            <Link
              href="/admin/metrics"
              className="w-fit border border-slate-200 px-4 py-3 text-xs font-extrabold text-[#075aa6]"
            >
              VIEW METRICS
            </Link>
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSubmitting || Boolean(busySlug)}
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
                  {editingArticle ? "Edit news article" : "Create a news article"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {editingArticle
                    ? "Changes publish immediately. The article URL and original publication date stay the same."
                    : "Articles publish immediately after they are saved."}{" "}
                  Gallery images are optional, up to 10 images at 5 MB each.
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
                  {editingArticle
                    ? "REPLACE COVER IMAGE (OPTIONAL, JPEG/PNG/WEBP, MAX 5 MB)"
                    : "COVER IMAGE (REQUIRED, JPEG/PNG/WEBP, MAX 5 MB)"}
                </span>
                {editingArticle && (
                  <span className="mt-1 block text-xs text-slate-500">
                    Leave empty to keep the current cover image.
                  </span>
                )}
                <input
                  key={coverInputKey}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required={!editingArticle}
                  onChange={(event) =>
                    setCoverImage(event.currentTarget.files?.[0] ?? null)
                  }
                  className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:text-xs file:font-bold"
                />
              </label>
              {editingArticle && editingArticle.gallery.length > 0 && (
                <fieldset>
                  <legend className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                    CURRENT GALLERY
                  </legend>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {editingArticle.gallery.map((image) => {
                      const isRemoved = removedGalleryUrls.includes(image.url);
                      return (
                        <label
                          key={image.url}
                          className={`border p-2 text-xs ${isRemoved ? "border-red-300 opacity-60" : "border-slate-200"}`}
                        >
                          <Image
                            src={image.url}
                            alt={image.alt}
                            width={180}
                            height={120}
                            className="h-24 w-full object-cover"
                          />
                          <span className="mt-2 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isRemoved}
                              onChange={() =>
                                setRemovedGalleryUrls((current) =>
                                  isRemoved
                                    ? current.filter((url) => url !== image.url)
                                    : [...current, image.url],
                                )
                              }
                            />
                            Remove photo
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}
              <label>
                <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                  {editingArticle
                    ? "ADD GALLERY PHOTOS (OPTIONAL)"
                    : `PHOTO GALLERY (OPTIONAL, UP TO ${maxGalleryImages} IMAGES)`}
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
                  JPEG, PNG, or WebP; each image must be 5 MB or smaller.{" "}
                  {editingArticle &&
                    "New photos are added to the gallery; check existing photos above to remove them."}
                </span>
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-fit bg-[#f6b71d] px-6 py-4 text-xs font-extrabold text-[#152238] disabled:cursor-wait disabled:opacity-50"
                >
                  {isSubmitting
                    ? editingArticle
                      ? "SAVING..."
                      : "PUBLISHING..."
                    : editingArticle
                      ? "SAVE CHANGES"
                      : "PUBLISH NEWS"}
                </button>
                {editingArticle && (
                  <button
                    type="button"
                    onClick={resetEditor}
                    disabled={isSubmitting}
                    className="w-fit border border-slate-200 px-6 py-4 text-xs font-extrabold text-[#071b33] disabled:opacity-50"
                  >
                    CANCEL EDIT
                  </button>
                )}
              </div>
            </form>

            <section className="mt-10">
              <h2 className="font-condensed text-4xl font-extrabold uppercase text-[#071b33]">
                Published articles
              </h2>
              {isLoadingNews ? (
                <p className="mt-4 bg-white p-6 text-sm text-slate-500">
                  Loading articles...
                </p>
              ) : articles.length === 0 ? (
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
                      <button
                        type="button"
                        onClick={() => void handleEdit(article)}
                        disabled={isLoadingArticle || Boolean(busySlug) || isSubmitting}
                        className="border border-slate-200 px-3 py-2 text-xs font-extrabold text-[#075aa6] disabled:opacity-50"
                      >
                        {isLoadingArticle ? "LOADING..." : "EDIT"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(article)}
                        disabled={Boolean(busySlug) || isSubmitting}
                        className="border border-red-200 px-3 py-2 text-xs font-extrabold text-red-700 disabled:opacity-50"
                      >
                        {busySlug === article.slug ? "DELETING..." : "DELETE"}
                      </button>
                    </article>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between bg-white p-4 text-xs text-slate-500">
                <p>
                  {total === 0
                    ? "0 articles"
                    : `${skip + 1}-${Math.min(skip + articles.length, total)} of ${total} articles`}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSkip((current) => Math.max(0, current - pageSize))
                    }
                    disabled={skip === 0 || isLoadingNews}
                    className="border border-slate-200 px-3 py-2 font-bold disabled:opacity-40"
                  >
                    PREVIOUS
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkip((current) => current + pageSize)}
                    disabled={skip + articles.length >= total || isLoadingNews}
                    className="border border-slate-200 px-3 py-2 font-bold disabled:opacity-40"
                  >
                    NEXT
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
