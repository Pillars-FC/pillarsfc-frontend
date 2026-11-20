"use client";

import { useState, type FormEvent } from "react";
import {
  sendContactMessage,
  type ContactSubmission,
} from "../lib/contact";

export default function ContactForm() {
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [hasError, setHasError] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const phone = String(formData.get("phone") ?? "").trim();
    const submission: ContactSubmission = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
      ...(phone ? { phone } : {}),
    };

    setIsSending(true);
    setFeedback("");
    setHasError(false);
    try {
      const response = await sendContactMessage(submission);
      setFeedback(response.message);
      form.reset();
    } catch (error) {
      console.error("Failed to send contact message:", error);
      setFeedback("We couldn't send your message. Please try again later.");
      setHasError(true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <h2 className="font-condensed text-4xl font-extrabold uppercase text-[#071b33]">
        Send a message
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Complete the form below and we will get back to you as soon as possible.
      </p>
      <form
        className="mt-7 grid gap-5 sm:grid-cols-2"
        onSubmit={handleSubmit}
        aria-busy={isSending}
      >
        <Field
          label="FULL NAME"
          name="name"
          placeholder="Your name"
          maxLength={120}
          required
        />
        <Field
          label="EMAIL ADDRESS"
          name="email"
          placeholder="you@example.com"
          type="email"
          maxLength={254}
          required
        />
        <Field
          label="PHONE NUMBER"
          name="phone"
          placeholder="+234 ..."
          type="tel"
          maxLength={40}
        />
        <label className="sm:col-span-2">
          <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
            YOUR MESSAGE
          </span>
          <textarea
            name="message"
            required
            maxLength={5000}
            className="mt-2 min-h-36 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
            placeholder="How can we help?"
          />
        </label>
        {feedback && (
          <p
            role={hasError ? "alert" : "status"}
            className={`sm:col-span-2 text-sm ${hasError ? "text-red-700" : "text-green-700"}`}
          >
            {feedback}
          </p>
        )}
        <button
          type="submit"
          disabled={isSending}
          className="w-fit bg-[#f6b71d] px-6 py-4 text-xs font-extrabold text-[#152238] disabled:cursor-wait disabled:opacity-60"
        >
          {isSending ? "SENDING..." : "SEND MESSAGE"}
        </button>
      </form>
    </>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  maxLength,
  required = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  maxLength: number;
  required?: boolean;
}) {
  return (
    <label>
      <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
      />
    </label>
  );
}
