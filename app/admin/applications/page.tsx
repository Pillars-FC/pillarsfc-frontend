"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { getAdminSession } from "../../lib/admin";
import {
  approveMemberApplication,
  getMemberApplications,
  rejectMemberApplication,
  type MemberApplication,
} from "../../lib/applications";

function formatDate(value: string | null): string {
  if (!value) return "Not provided";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<MemberApplication[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [workingApplicationId, setWorkingApplicationId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let isMounted = true;
    getAdminSession()
      .then(() => {
        if (!isMounted) return;
        setIsAuthenticated(true);
        return getMemberApplications().then((items) => {
          if (isMounted) setApplications(items);
        });
      })
      .catch((requestError: unknown) => {
        if (!isMounted) return;
        if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          console.error("Failed to load membership applications:", requestError);
          setError("Applications could not be loaded. Please try again.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleReview = async (
    application: MemberApplication,
    action: "approve" | "reject",
  ) => {
    setWorkingApplicationId(application.application_id);
    setError("");
    setFeedback("");
    try {
      if (action === "approve") {
        const approved = await approveMemberApplication(application.application_id);
        setApplications((current) =>
          current.filter((item) => item.application_id !== application.application_id),
        );
        setFeedback(
          `${approved.first_name} ${approved.last_name} approved as member ${approved.membership_id}.`,
        );
      } else {
        await rejectMemberApplication(application.application_id);
        setApplications((current) =>
          current.filter((item) => item.application_id !== application.application_id),
        );
        setFeedback(`${application.first_name} ${application.last_name}'s application was rejected.`);
      }
    } catch (requestError) {
      console.error("Failed to review membership application:", requestError);
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        setIsAuthenticated(false);
        setError("Your admin session expired. Sign in again to review applications.");
      } else if (axios.isAxiosError(requestError) && requestError.response?.status === 409) {
        setError("This application was already reviewed. Reload the page to refresh the queue.");
      } else {
        setError("Could not update this application. Please try again.");
      }
    } finally {
      setWorkingApplicationId(null);
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
              Applications
            </h1>
            <p className="mt-4 text-sm text-slate-500">
              Review applications before adding people to the member directory.
            </p>
          </div>
          <Link
            href="/admin/members"
            className="w-fit border border-slate-200 px-4 py-3 text-xs font-extrabold text-[#075aa6]"
          >
            MANAGE MEMBERS
          </Link>
        </div>

        {!isLoading && !isAuthenticated ? (
          <section className="mt-10 bg-white p-8 text-center shadow-[0_6px_26px_rgba(13,35,50,.06)]">
            <p className="text-sm text-slate-600">
              Sign in to review membership applications.
            </p>
            <Link
              href="/admin/members"
              className="mt-5 inline-block bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white"
            >
              ADMIN SIGN IN
            </Link>
          </section>
        ) : isLoading ? (
          <p className="mt-10 bg-white p-8 text-center text-sm text-slate-500" aria-live="polite">
            Loading applications...
          </p>
        ) : (
          <section className="mt-10 space-y-5">
            {error && (
              <p role="alert" className="bg-white p-5 text-sm text-red-700">{error}</p>
            )}
            {feedback && (
              <p role="status" className="bg-white p-5 text-sm text-green-700">{feedback}</p>
            )}
            {applications.length === 0 ? (
              <p className="bg-white p-8 text-center text-sm text-slate-500">
                There are no pending applications.
              </p>
            ) : (
              applications.map((application) => (
                <article
                  key={application.application_id}
                  className="bg-white p-6 shadow-[0_6px_26px_rgba(13,35,50,.06)] sm:p-8"
                >
                  <div className="flex flex-col gap-6 md:flex-row">
                    {application.image_url ? (
                      <a
                        href={application.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-40 w-40 shrink-0"
                      >
                        <Image
                          src={application.image_url}
                          alt={`${application.first_name} ${application.last_name} application photo`}
                          width={160}
                          height={160}
                          className="h-40 w-40 rounded-lg object-cover"
                        />
                      </a>
                    ) : (
                      <div className="grid h-40 w-40 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm text-slate-500">
                        No photo
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row">
                        <div>
                          <h2 className="font-condensed text-3xl font-extrabold uppercase text-[#071b33]">
                            {application.first_name} {application.last_name}
                          </h2>
                          <p className="mt-1 font-mono text-xs text-slate-500">
                            {application.application_id}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          Submitted {formatDate(application.submitted_at)}
                        </p>
                      </div>
                      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-[10px] font-extrabold tracking-wider text-slate-500">EMAIL</dt>
                          <dd className="mt-1 break-all text-[#071b33]">{application.email}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-extrabold tracking-wider text-slate-500">PHONE</dt>
                          <dd className="mt-1 text-[#071b33]">{application.phone}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-extrabold tracking-wider text-slate-500">ADDRESS</dt>
                          <dd className="mt-1 text-[#071b33]">{application.address}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-extrabold tracking-wider text-slate-500">PREFERRED POSITION</dt>
                          <dd className="mt-1 text-[#071b33]">{application.preferred_position}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-extrabold tracking-wider text-slate-500">DATE OF BIRTH</dt>
                          <dd className="mt-1 text-[#071b33]">{formatDate(application.date_of_birth)}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-extrabold tracking-wider text-slate-500">UPDATES CONSENT</dt>
                          <dd className="mt-1 text-[#071b33]">Agreed on {formatDate(application.consented_at)}</dd>
                        </div>
                      </dl>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleReview(application, "approve")}
                          disabled={workingApplicationId !== null}
                          className="bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white disabled:cursor-wait disabled:opacity-50"
                        >
                          {workingApplicationId === application.application_id ? "UPDATING..." : "APPROVE"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(application, "reject")}
                          disabled={workingApplicationId !== null}
                          className="border border-red-200 px-5 py-3 text-xs font-extrabold text-red-700 disabled:cursor-wait disabled:opacity-50"
                        >
                          REJECT
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        )}
      </main>
    </>
  );
}
