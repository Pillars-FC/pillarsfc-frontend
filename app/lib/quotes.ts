import api from "./api";

export interface Quote {
  id: number;
  quote: string;
  author: string;
  when: string;
}

interface QuoteResponse {
  status: "success";
  data: Quote;
}

export async function getQuote(signal?: AbortSignal): Promise<Quote> {
  const response = await api.get<QuoteResponse>("/quote-of-the-day", { signal });
  return response.data.data;
}
