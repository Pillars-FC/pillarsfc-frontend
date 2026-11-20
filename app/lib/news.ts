import api from "./api";

export interface NewsImage {
  url: string;
  alt: string;
}

export interface NewsCard {
  slug: string;
  title: string;
  category: string;
  summary: string;
  cover_image_url: string;
  published_at: string;
}

export interface NewsArticle extends NewsCard {
  content: string;
  gallery: NewsImage[];
}

interface NewsListResponse {
  status: "success";
  data: NewsCard[];
  total: number;
}

interface NewsArticleResponse {
  status: "success";
  data: NewsArticle;
}

interface NewsCreatedResponse {
  status: "success";
  data: NewsArticle;
}

export async function getNews(
  params: { skip: number; limit: number },
  signal?: AbortSignal,
): Promise<NewsListResponse> {
  const response = await api.get<NewsListResponse>("/news", { params, signal });
  return response.data;
}

export async function getNewsArticle(
  slug: string,
  signal?: AbortSignal,
): Promise<NewsArticle> {
  const response = await api.get<NewsArticleResponse>(
    `/news/${encodeURIComponent(slug)}`,
    { signal },
  );
  return response.data.data;
}

export interface NewsCreateInput {
  title: string;
  category: string;
  summary: string;
  content: string;
  coverImage: File;
  gallery: File[];
}

export async function createNewsArticle(
  article: NewsCreateInput,
): Promise<NewsArticle> {
  const formData = new FormData();
  formData.append("title", article.title);
  formData.append("category", article.category);
  formData.append("summary", article.summary);
  formData.append("content", article.content);
  formData.append("cover_image", article.coverImage);
  article.gallery.forEach((image) => formData.append("gallery", image));

  const response = await api.post<NewsCreatedResponse>("/admin/news", formData, {
    withCredentials: true,
    timeout: 90_000,
  });
  return response.data.data;
}
