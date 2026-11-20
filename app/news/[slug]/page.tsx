import { Suspense } from "react";
import NewsArticleClient from "./news-article-client";

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
