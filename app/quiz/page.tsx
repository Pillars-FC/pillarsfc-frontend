"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  getQuiz,
  submitQuiz,
  type QuizAnswer,
  type QuizQuestion,
  type QuizScore,
} from "../lib/quiz";

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<QuizScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getQuiz(controller.signal)
      .then((loadedQuestions) => {
        setQuestions(loadedQuestions);
        setAnswers(Array(loadedQuestions.length).fill(null));
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load quiz questions:", requestError);
        setError("The quiz is unavailable right now. Please try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const loadNewQuiz = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrent(0);

    try {
      const loadedQuestions = await getQuiz();
      setQuestions(loadedQuestions);
      setAnswers(Array(loadedQuestions.length).fill(null));
    } catch (requestError) {
      console.error("Failed to load quiz questions:", requestError);
      setError("The quiz is unavailable right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectAnswer = (option: string) => {
    setAnswers((previous) =>
      previous.map((answer, index) => (index === current ? option : answer)),
    );
  };

  const finishQuiz = async () => {
    if (answers.some((answer) => answer === null)) return;

    setIsSubmitting(true);
    setError(null);
    const submission: QuizAnswer[] = questions.flatMap((question, index) => {
      const selectedAnswer = answers[index];
      return selectedAnswer === null || selectedAnswer === undefined
        ? []
        : [{ question_id: question.id, selected_answer: selectedAnswer }];
    });

    try {
      setResult(await submitQuiz(submission));
    } catch (requestError) {
      console.error("Failed to submit quiz answers:", requestError);
      setError("Your answers could not be scored. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const choice = answers[current] ?? null;
  const question = questions[current];

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-82px)] bg-[#f3f6f8] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-[11px] font-extrabold tracking-[.16em] text-[#075aa6]">
            PILLARS FC CHALLENGE
          </p>
          <h1 className="mt-2 text-center font-condensed text-6xl font-black uppercase leading-[.82] text-[#071b33] sm:text-7xl">
            Club Quiz
          </h1>

          {isLoading ? (
            <section className="mt-10 bg-white p-8 text-center text-sm font-semibold shadow-[0_6px_26px_rgba(13,35,50,.06)]">
              Loading quiz questions...
            </section>
          ) : error && questions.length === 0 ? (
            <section className="mt-10 bg-white p-8 text-center shadow-[0_6px_26px_rgba(13,35,50,.06)]">
              <p role="alert" className="text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={loadNewQuiz}
                className="mt-6 bg-[#075aa6] px-6 py-4 text-xs font-extrabold text-white"
              >
                TRY AGAIN
              </button>
            </section>
          ) : result ? (
            <section className="mt-10 bg-white p-8 text-center shadow-[0_6px_26px_rgba(13,35,50,.06)] sm:p-12">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#f6b71d] font-condensed text-5xl font-black text-[#071b33]">
                {result.score}/{result.total}
              </div>
              <h2 className="mt-6 font-condensed text-4xl font-extrabold uppercase text-[#071b33]">
                Quiz complete!
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                Your answers have been scored. Try again for a new set of questions.
              </p>
              <button
                type="button"
                onClick={loadNewQuiz}
                className="mt-7 bg-[#075aa6] px-6 py-4 text-xs font-extrabold text-white"
              >
                TRY AGAIN
              </button>
            </section>
          ) : question ? (
            <section className="mt-10 overflow-hidden bg-white shadow-[0_6px_26px_rgba(13,35,50,.06)]">
              <div className="h-2 bg-slate-100">
                <div
                  className="h-full bg-[#f6b71d] transition-all"
                  style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                />
              </div>
              <div className="p-7 sm:p-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold tracking-wider text-[#075aa6]">
                    QUESTION {current + 1} OF {questions.length}
                  </span>
                  <span className="text-xs text-slate-500">
                    {answers.filter((answer) => answer !== null).length} answered
                  </span>
                </div>
                <h2 className="mt-6 font-condensed text-4xl font-extrabold uppercase leading-[.95] text-[#071b33] sm:text-5xl">
                  {question.question}
                </h2>
                <div className="mt-8 grid gap-3">
                  {question.options.map((option, index) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => selectAnswer(option)}
                      aria-pressed={choice === option}
                      className={`flex items-center gap-4 border p-4 text-left text-sm font-bold transition ${choice === option ? "border-[#075aa6] bg-blue-50 text-[#075aa6]" : "border-slate-200 hover:border-[#075aa6]"}`}
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs ${choice === option ? "bg-[#075aa6] text-white" : "bg-slate-100 text-slate-600"}`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>

                {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}

                <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
                  <button
                    type="button"
                    onClick={() => setCurrent((value) => Math.max(0, value - 1))}
                    disabled={current === 0 || isSubmitting}
                    className="px-4 py-3 text-xs font-extrabold text-[#071b33] disabled:opacity-30"
                  >
                    ← PREVIOUS
                  </button>
                  {current === questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={finishQuiz}
                      disabled={choice === null || isSubmitting}
                      className="bg-[#f6b71d] px-5 py-3 text-xs font-extrabold text-[#152238] disabled:opacity-40"
                    >
                      {isSubmitting ? "SCORING..." : "FINISH QUIZ"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCurrent((value) => value + 1)}
                      disabled={choice === null || isSubmitting}
                      className="bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white disabled:opacity-40"
                    >
                      NEXT QUESTION →
                    </button>
                  )}
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}
