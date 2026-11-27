"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Navbar from "../../components/Navbar";
import { getAdminSession, loginAdmin, logoutAdmin } from "../../lib/admin";
import {
  createMember,
  type PreferredPosition,
} from "../../lib/members";
import AdminMemberManager from "./AdminMemberManager";

export default function AdminMembersPage() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [preferredPosition, setPreferredPosition] =
    useState<PreferredPosition>("Midfielder");
  const [image, setImage] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberListRefresh, setMemberListRefresh] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [hasError, setHasError] = useState(false);

  const handleSessionExpired = useCallback(() => {
    setIsAuthenticated(false);
    setAdminUsername("");
    setFeedback("Your admin session expired. Please sign in again.");
    setHasError(true);
  }, []);

  useEffect(() => {
    getAdminSession()
      .then((session) => {
        setAdminUsername(session.username);
        setIsAuthenticated(true);
      })
      .catch((error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) return;
        console.error("Failed to check admin session:", error);
        setFeedback("Admin sign-in is unavailable. Check the backend configuration.");
        setHasError(true);
      })
      .finally(() => setIsCheckingSession(false));
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback("");
    setHasError(false);
    try {
      const session = await loginAdmin({ username, password });
      setAdminUsername(session.username);
      setPassword("");
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Admin login failed:", error);
      setFeedback(
        axios.isAxiosError(error) && error.response?.status === 401
          ? "The username or password is incorrect."
          : "Could not sign in. Please check the server and try again.",
      );
      setHasError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback("");
    setHasError(false);
    try {
      const member = await createMember({
        name,
        email,
        phone,
        address,
        preferred_position: preferredPosition,
        image,
      });
      setMemberListRefresh((current) => current + 1);
      setFeedback(`Added ${member.name} with membership ID ${member.membership_id}.`);
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setPreferredPosition("Midfielder");
      setImage(null);
      setFileInputKey((key) => key + 1);
    } catch (error) {
      console.error("Failed to add member:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setIsAuthenticated(false);
        setFeedback("Your admin session expired. Please sign in again.");
      } else if (axios.isAxiosError(error) && error.response?.status === 413) {
        setFeedback("The image must be 5 MB or smaller.");
      } else if (axios.isAxiosError(error) && error.response?.status === 415) {
        setFeedback("Choose a JPEG, PNG, or WebP image.");
      } else if (axios.isAxiosError(error) && error.response?.status === 503) {
        setFeedback("Image uploads are not configured on the server.");
      } else if (axios.isAxiosError(error) && error.response?.status === 502) {
        setFeedback("The image upload failed. Please try again.");
      } else {
        setFeedback("Could not add this member. Please try again.");
      }
      setHasError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    setFeedback("");
    try {
      await logoutAdmin();
      setIsAuthenticated(false);
      setAdminUsername("");
      setFeedback("You have been signed out.");
    } catch (error) {
      console.error("Admin logout failed:", error);
      setFeedback("Could not sign out. Please try again.");
      setHasError(true);
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
        <h1 className="mt-2 font-condensed text-6xl font-black uppercase leading-[.82] text-[#071b33] sm:text-7xl">
          Manage Members
        </h1>

        <section className="mt-10 bg-white p-7 shadow-[0_6px_26px_rgba(13,35,50,.06)] sm:p-10">
          {isCheckingSession ? (
            <p className="text-sm text-slate-500" aria-live="polite">
              Checking admin session...
            </p>
          ) : isAuthenticated ? (
            <>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-condensed text-4xl font-extrabold uppercase text-[#071b33]">
                    Add a member
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Signed in as {adminUsername}. Membership ID and join date are generated
                    automatically. Contact details remain private.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/admin/applications"
                    className="w-fit bg-[#075aa6] px-4 py-3 text-xs font-extrabold text-white"
                  >
                    REVIEW APPLICATIONS
                  </Link>
                  <Link
                    href="/admin/news"
                    className="w-fit border border-slate-200 px-4 py-3 text-xs font-extrabold text-[#075aa6]"
                  >
                    MANAGE NEWS
                  </Link>
                  <Link
                    href="/admin/metrics"
                    className="w-fit border border-slate-200 px-4 py-3 text-xs font-extrabold text-[#075aa6]"
                  >
                    VIEW METRICS
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isSubmitting}
                    className="w-fit border border-slate-200 px-4 py-3 text-xs font-extrabold text-[#071b33] disabled:opacity-50"
                  >
                    SIGN OUT
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateMember} className="mt-7 grid max-w-2xl gap-5">
                <label>
                  <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                    FULL NAME
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete="name"
                    className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                  />
                </label>
                <label>
                  <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                    EMAIL
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    maxLength={254}
                    autoComplete="email"
                    className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                  />
                </label>
                <label>
                  <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                    PHONE NUMBER
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                    minLength={7}
                    maxLength={30}
                    autoComplete="tel"
                    className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                  />
                </label>
                <label>
                  <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                    ADDRESS
                  </span>
                  <textarea
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    required
                    minLength={5}
                    maxLength={300}
                    autoComplete="street-address"
                    rows={3}
                    className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                  />
                </label>
                <label>
                  <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                    PREFERRED POSITION
                  </span>
                  <select
                    value={preferredPosition}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      if (
                        value === "Goalkeeper" ||
                        value === "Defender" ||
                        value === "Midfielder" ||
                        value === "Forward"
                      ) {
                        setPreferredPosition(value);
                      }
                    }}
                    className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                  >
                    <option value="Goalkeeper">Goalkeeper</option>
                    <option value="Defender">Defender</option>
                    <option value="Midfielder">Midfielder</option>
                    <option value="Forward">Forward</option>
                  </select>
                </label>
                <label>
                  <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                    PROFILE IMAGE (OPTIONAL, JPEG/PNG/WEBP, MAX 5 MB)
                  </span>
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      setImage(event.currentTarget.files?.[0] ?? null)
                    }
                    className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:text-xs file:font-bold"
                  />
                </label>
                {feedback && (
                  <p
                    role={hasError ? "alert" : "status"}
                    className={`text-sm ${hasError ? "text-red-700" : "text-green-700"}`}
                  >
                    {feedback}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-fit bg-[#f6b71d] px-6 py-4 text-xs font-extrabold text-[#152238] disabled:cursor-wait disabled:opacity-50"
                >
                  {isSubmitting ? "SAVING..." : "ADD MEMBER"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-condensed text-4xl font-extrabold uppercase text-[#071b33]">
                Admin sign in
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to add members to the club directory.
              </p>
              <form onSubmit={handleLogin} className="mt-7 grid gap-5">
                <label>
                  <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                    USERNAME
                  </span>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    maxLength={100}
                    autoComplete="username"
                    className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                  />
                </label>
                <label>
                  <span className="text-[10px] font-extrabold tracking-wider text-[#071b33]">
                    PASSWORD
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    maxLength={256}
                    autoComplete="current-password"
                    className="mt-2 w-full border border-slate-200 p-3 text-sm outline-none focus:border-[#075aa6]"
                  />
                </label>
                {feedback && (
                  <p
                    role={hasError ? "alert" : "status"}
                    className={`text-sm ${hasError ? "text-red-700" : "text-green-700"}`}
                  >
                    {feedback}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-fit bg-[#075aa6] px-6 py-4 text-xs font-extrabold text-white disabled:cursor-wait disabled:opacity-50"
                >
                  {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
                </button>
              </form>
            </>
          )}
        </section>

        {!isCheckingSession && isAuthenticated && (
          <AdminMemberManager
            refreshToken={memberListRefresh}
            onSessionExpired={handleSessionExpired}
          />
        )}

        <Link
          href="/members"
          className="mt-7 inline-block text-xs font-extrabold tracking-wider text-[#075aa6]"
        >
          VIEW MEMBER DIRECTORY
        </Link>
      </main>
    </>
  );
}
