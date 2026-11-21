import axios from "axios";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getNewsArticle } from "../../lib/news";
import NewsArticleClient from "./news-article-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const article = await getNewsArticle(slug);
    const title = `${article.title} | Pillars Football Club`;
    const description = article.summary;
    const image = {
      url: article.cover_image_url,
      alt: article.title,
    };

    return {
      title,
      description,
      openGraph: {
        type: "article",
        title,
        description,
        url: `/news/${encodeURIComponent(article.slug)}`,
        siteName: "Pillars Football Club",
        publishedTime: article.published_at,
        images: [image],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        title: "News article not found | Pillars Football Club",
        description: "This news article could not be found.",
      };
    }
    throw error;
  }
}

function ArticleLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <p className="bg-white p-8 text-center text-sm text-slate-500" aria-live="polite">
        Loading article...
      </p>
    </main>
  );
}

async function ArticleContent({ params }: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <NewsArticleClient slug={slug} />;
}

export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<ArticleLoading />}>
      <ArticleContent params={params} />
    </Suspense>
  );
}
