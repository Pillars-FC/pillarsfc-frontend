import api from "./api";

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

interface QuizResponse {
  status: "success";
  data: QuizQuestion[];
}

export interface QuizAnswer {
  question_id: number;
  selected_answer: string;
}

export interface QuizScore {
  score: number;
  total: number;
}

interface QuizScoreResponse {
  status: "success";
  data: QuizScore;
}

export async function getQuiz(signal?: AbortSignal): Promise<QuizQuestion[]> {
  const response = await api.get<QuizResponse>("/quiz", { signal });
  return response.data.data;
}

export async function submitQuiz(answers: QuizAnswer[]): Promise<QuizScore> {
  const response = await api.post<QuizScoreResponse>("/quiz/score", { answers });
  return response.data.data;
}
