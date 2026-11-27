"use client";

import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  analyticsPreferencesEventName,
  clearAnalyticsIdentifiers,
  getAnalyticsConsentSnapshot,
  getDeviceCategory,
  getEngagementAlreadyRecorded,
  getSessionSource,
  getServerAnalyticsConsentSnapshot,
  markEngagementRecorded,
  normalizeTrackedPath,
  recordAnalyticsEvent,
  saveAnalyticsConsent,
  subscribeToAnalyticsConsent,
  type WebVitalName,
} from "../lib/analytics";

const vitalNames: WebVitalName[] = ["CLS", "FCP", "INP", "LCP", "TTFB"];

function isWebVitalName(name: string): name is WebVitalName {
  return vitalNames.some((vitalName) => vitalName === name);
}

const reportWebVital: Parameters<typeof useReportWebVitals>[0] = (metric) => {
  if (!isWebVitalName(metric.name)) return;
  let path = window.location.pathname;
  if (metric.navigationURL) {
    try {
      path = new URL(metric.navigationURL, window.location.origin).pathname;
    } catch (error) {
      console.error("Could not read the Web Vital navigation path:", error);
    }
  }
  if (path === "/admin" || path.startsWith("/admin/")) return;
  recordAnalyticsEvent({
    event: "web_vital",
    path: normalizeTrackedPath(path),
    metric_name: metric.name,
    metric_value: metric.value,
  });
};

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    getAnalyticsConsentSnapshot,
    getServerAnalyticsConsentSnapshot,
  );
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [storageError, setStorageError] = useState("");
  const lastViewedPath = useRef<string | null>(null);
  const currentPath = useRef("/");

  useReportWebVitals(reportWebVital);

  useEffect(() => {
    const openPreferences = () => setIsPreferencesOpen(true);
    const eventName = analyticsPreferencesEventName();
    window.addEventListener(eventName, openPreferences);
    return () => window.removeEventListener(eventName, openPreferences);
  }, []);

  useEffect(() => {
    currentPath.current = pathname || "/";
  }, [pathname]);

  useEffect(() => {
    if (consent !== "accepted") {
      lastViewedPath.current = null;
      return;
    }
    if (!pathname || pathname === "/admin" || pathname.startsWith("/admin/")) {
      lastViewedPath.current = null;
      return;
    }
    if (lastViewedPath.current === pathname) {
      return;
    }
    lastViewedPath.current = pathname;
    recordAnalyticsEvent({
      event: "page_view",
      path: normalizeTrackedPath(pathname),
      source: getSessionSource(),
      device: getDeviceCategory(),
    });
  }, [consent, pathname]);

  useEffect(() => {
    if (consent !== "accepted") return;

    let activeTimer: ReturnType<typeof setTimeout> | null = null;
    let isRecorded = false;
    const startTimer = () => {
      if (
        activeTimer !== null ||
        isRecorded ||
        getEngagementAlreadyRecorded() ||
        document.visibilityState !== "visible"
      ) {
        return;
      }
      activeTimer = setTimeout(() => {
        activeTimer = null;
        isRecorded = true;
        markEngagementRecorded();
        recordAnalyticsEvent({
          event: "engaged_session",
          path: normalizeTrackedPath(currentPath.current),
        });
      }, 10_000);
    };
    const updateVisibility = () => {
      if (document.visibilityState === "hidden" && activeTimer !== null) {
        clearTimeout(activeTimer);
        activeTimer = null;
      } else {
        startTimer();
      }
    };

    startTimer();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      if (activeTimer !== null) clearTimeout(activeTimer);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [consent, pathname]);

  useEffect(() => {
    if (consent !== "accepted") return;
    const reportClientError = () =>
      recordAnalyticsEvent({
        event: "client_error",
        path: normalizeTrackedPath(currentPath.current),
      });
    window.addEventListener("error", reportClientError);
    window.addEventListener("unhandledrejection", reportClientError);
    return () => {
      window.removeEventListener("error", reportClientError);
      window.removeEventListener("unhandledrejection", reportClientError);
    };
  }, [consent]);

  const saveConsent = (choice: "accepted" | "rejected") => {
    try {
      saveAnalyticsConsent(choice);
      if (choice === "rejected") clearAnalyticsIdentifiers();
      setIsPreferencesOpen(false);
      setStorageError("");
    } catch (error) {
      console.error("Could not save analytics preferences:", error);
      setStorageError(
        "Your preference could not be saved or cleared. Analytics remains disabled.",
      );
    }
  };

  if (
    consent === "unknown" ||
    (!isPreferencesOpen &&
      (consent === "accepted" || consent === "rejected")) ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    return null;
  }

  return (
    <aside
      aria-label="Analytics preferences"
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-2xl border border-slate-200 bg-white p-5 shadow-xl sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <p className="font-condensed text-xl font-extrabold uppercase text-[#071b33]">
        Help us improve the website
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        If you opt in, we collect page visits, broad device and traffic-source
        categories, and performance data using a random browser ID. We do not
        collect IP addresses, form contents, or raw user-agent strings. You can
        change this choice at any time. These analytics records are deleted
        after 180 days. Separately, admin reports count successful contact and
        quiz submissions without visitor IDs or submitted answers.
      </p>
      {storageError && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {storageError}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => saveConsent("accepted")}
          className="bg-[#075aa6] px-4 py-3 text-xs font-extrabold text-white"
        >
          ACCEPT ANALYTICS
        </button>
        <button
          type="button"
          onClick={() => saveConsent("rejected")}
          className="border border-slate-300 px-4 py-3 text-xs font-extrabold text-[#071b33]"
        >
          {consent === "accepted" ? "TURN OFF ANALYTICS" : "NO THANKS"}
        </button>
        {consent !== null && (
          <button
            type="button"
            onClick={() => setIsPreferencesOpen(false)}
            className="px-3 py-3 text-xs font-bold text-slate-600"
          >
            CLOSE
          </button>
        )}
      </div>
    </aside>
  );
}
