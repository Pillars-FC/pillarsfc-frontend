"use client";

import axios from "axios";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Navbar from "../components/Navbar";
import { recordAnalyticsEvent } from "../lib/analytics";
import { submitMemberApplication } from "../lib/applications";
import type { PreferredPosition } from "../lib/members";

const maxPhotoSize = 5 * 1024 * 1024;
const allowedPhotoTypes = ["image/jpeg", "image/png", "image/webp"];
const positions: PreferredPosition[] = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Forward",
];

export default function JoinPage() {
  const hasTrackedStart = useRef(false);
  const [photoName, setPhotoName] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [hasError, setHasError] = useState(false);

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    setPhotoError("");
    setPhotoName(file?.name ?? "");
    if (!file) return;

    if (!allowedPhotoTypes.includes(file.type)) {
      setPhotoError("Choose a JPEG, PNG, or WebP image.");
      event.currentTarget.value = "";
      setPhotoName("");
    } else if (file.size > maxPhotoSize) {
      setPhotoError("The image must be 5 MB or smaller.");
      event.currentTarget.value = "";
      setPhotoName("");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (photoError) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const photoInput = form.elements.namedItem("image");
    if (photoInput instanceof HTMLInputElement && !photoInput.files?.length) {
      formData.delete("image");
    }
    setIsSubmitting(true);
    setFeedback("");
    setHasError(false);
    try {
      const application = await submitMemberApplication(formData);
      recordAnalyticsEvent({
        event: "application_submitted",
        path: "/join",
      });
      form.reset();
      setPhotoName("");
      setFeedback(
        `Application submitted for review. Your reference is ${application.application_id}.`,
      );
    } catch (error) {
      console.error("Failed to submit membership application:", error);
      if (axios.isAxiosError(error) && error.response?.status === 413) {
        setFeedback("The image must be 5 MB or smaller.");
      } else if (axios.isAxiosError(error) && error.response?.status === 415) {
        setFeedback("Choose a JPEG, PNG, or WebP image.");
      } else if (axios.isAxiosError(error) && error.response?.status === 429) {
        setFeedback("Too many applications were submitted. Please wait a minute and try again.");
      } else if (axios.isAxiosError(error) && error.response?.status === 503) {
        setFeedback("Photo uploads are not configured. Please contact the club.");
      } else {
        setFeedback("Could not submit your application. Check the form and try again.");
      }
      setHasError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-82px)] bg-[#f3f6f8] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-[11px] font-extrabold tracking-[.16em] text-[#075aa6]">
            JOIN THE PILLARS FAMILY
          </p>
          <h1 className="mt-2 text-center font-condensed text-6xl font-black uppercase leading-[.82] text-[#071b33] sm:text-7xl">
            Become a member
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-6 text-slate-500">
            Complete your details below to submit a membership application for club review.
            Fields marked with * are required.
          </p>
          <form
            onSubmit={handleSubmit}
            onFocusCapture={() => {
              if (hasTrackedStart.current) return;
              hasTrackedStart.current = true;
              recordAnalyticsEvent({
                event: "application_started",
                path: "/join",
              });
            }}
            className="mt-10 bg-white p-7 shadow-[0_6px_26px_rgba(13,35,50,.06)] sm:p-10"
          >
            <h2 className="font-condensed text-3xl font-extrabold uppercase text-[#071b33]">
              Personal Details
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field
                name="first_name"
                label="FIRST NAME *"
                placeholder="Enter your first name"
                autoComplete="given-name"
                required
              />
              <Field
                name="last_name"
                label="LAST NAME *"
                placeholder="Enter your last name"
                autoComplete="family-name"
                required
              />
              <Field
                name="email"
                label="EMAIL ADDRESS *"
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                required
              />
              <Field
                name="phone"
                label="PHONE NUMBER *"
                placeholder="+234 ..."
                type="tel"
                autoComplete="tel"
                required
              />
              <Field
                name="date_of_birth"
                label="DATE OF BIRTH"
                type="date"
              />
              <label>
                <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                  PREFERRED POSITION *
                </span>
                <select
                  name="preferred_position"
                  defaultValue=""
                  required
                  className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                >
                  <option value="" disabled>Select a position</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                  HOME ADDRESS *
                </span>
                <textarea
                  name="address"
                  required
                  minLength={5}
                  maxLength={300}
                  autoComplete="street-address"
                  rows={3}
                  className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                />
              </label>
            </div>

            <h2 className="mt-10 border-t border-slate-200 pt-8 font-condensed text-3xl font-extrabold uppercase text-[#071b33]">
              Profile Photo
            </h2>
            <p id="photo-description" className="mt-2 text-sm leading-6 text-slate-500">
              Upload a clear photo for your membership profile. JPEG, PNG, or WebP, up to 5 MB.
            </p>
            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-300 p-9 text-center transition hover:border-[#075aa6] hover:bg-blue-50">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-100 text-xl text-[#075aa6]">
                ↑
              </span>
              <span className="mt-3 text-sm font-bold text-[#071b33]">
                Choose an image to upload
              </span>
              <span className="mt-1 text-xs text-slate-500">
                {photoName || "JPEG, PNG, or WebP"}
              </span>
              <input
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-describedby="photo-description"
                onChange={handlePhotoChange}
                className="sr-only"
              />
            </label>
            {photoError && (
              <p role="alert" className="mt-2 text-sm text-red-700">{photoError}</p>
            )}

            <label className="mt-7 flex items-start gap-3 text-sm leading-5 text-slate-600">
              <input
                type="checkbox"
                name="consent"
                value="true"
                required
                className="mt-1 h-4 w-4 accent-[#075aa6]"
              />
              <span>
                I confirm that the information provided is accurate and agree to receive
                membership updates from Pillars FC.
              </span>
            </label>

            {feedback && (
              <p
                role={hasError ? "alert" : "status"}
                className={`mt-5 text-sm ${hasError ? "text-red-700" : "text-green-700"}`}
              >
                {feedback}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting || Boolean(photoError)}
              className="mt-8 bg-[#f6b71d] px-6 py-4 text-xs font-extrabold text-[#152238] disabled:cursor-wait disabled:opacity-50"
            >
              {isSubmitting ? "SUBMITTING..." : "SUBMIT APPLICATION"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  autoComplete,
  required = false,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
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
        required={required}
        autoComplete={autoComplete}
        className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
      />
    </label>
  );
}
