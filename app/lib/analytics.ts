import api from "./api";

export type AnalyticsEventName =
  | "page_view"
  | "application_started"
  | "application_submitted"
  | "engaged_session"
  | "client_error"
  | "web_vital";
export type AnalyticsDevice = "mobile" | "tablet" | "desktop";
export type AnalyticsSource = "direct" | "search" | "social" | "referral";
export type WebVitalName = "CLS" | "FCP" | "INP" | "LCP" | "TTFB";

export interface AnalyticsEvent {
  event: AnalyticsEventName;
  path: string;
  source?: AnalyticsSource;
  device?: AnalyticsDevice;
  metric_name?: WebVitalName;
  metric_value?: number;
}

export interface MetricsResponse {
  status: "success";
  period: { days: number; start: string; end: string };
  daily: {
    date: string;
    views: number;
    visitors: number;
    applications: number;
    members: number;
    subscriptions: number;
    articles: number;
    api_requests: number;
  }[];
  audience: {
    page_views: number;
    visitors: number;
    new_visitors: number;
    returning_visitors: number;
    sessions: number;
    engaged_sessions: number;
    top_pages: { path: string; views: number }[];
    sources: { name: string; count: number }[];
    devices: { name: string; count: number }[];
  };
  membership: {
    active_members: number;
    inactive_members: number;
    total_members: number;
    applications_submitted: number;
    application_starts: number;
    application_conversion_percent: number;
    approval_rate_percent: number;
    average_review_hours: number;
    applications_by_status: Record<string, number>;
    positions: { name: string; count: number }[];
  };
  community: {
    subscribers: number;
    new_subscribers: number;
    contact_submissions: number;
    quiz_completions: number;
  };
  content: {
    published_articles: number;
    categories: { name: string; count: number }[];
    top_articles: { path: string; views: number }[];
  };
  health: {
    api_status: string;
    api_requests: number;
    failed_requests: number;
    api_errors: number;
    api_success_percent: number;
    slow_requests: number;
    average_response_ms: number;
    client_errors: number;
    web_vitals: { name: WebVitalName; average: number; samples: number }[];
  };
}

const consentKey = "pfc-analytics-consent";
const visitorKey = "pfc-analytics-visitor";
const visitorCreatedKey = "pfc-analytics-visitor-created";
const sessionKey = "pfc-analytics-session";
const sessionStartedKey = "pfc-analytics-session-started";
const sessionSourceKey = "pfc-analytics-source";
const engagedKey = "pfc-analytics-engaged";
const sessionDurationMs = 30 * 60 * 1000;
const visitorDurationMs = 180 * 24 * 60 * 60 * 1000;
const preferencesEvent = "pfc:analytics-preferences";
const consentChangedEvent = "pfc:analytics-consent-changed";
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function getIdentifier(storage: Storage, key: string): string {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const identifier = crypto.randomUUID();
  storage.setItem(key, identifier);
  return identifier;
}

function getSessionId(): string {
  const now = Date.now();
  const startedAt = Number(sessionStorage.getItem(sessionStartedKey));
  if (!startedAt || now - startedAt >= sessionDurationMs) {
    sessionStorage.setItem(sessionStartedKey, String(now));
    sessionStorage.setItem(sessionKey, crypto.randomUUID());
    sessionStorage.removeItem(sessionSourceKey);
    sessionStorage.removeItem(engagedKey);
  }
  sessionStorage.setItem(sessionStartedKey, String(now));
  return getIdentifier(sessionStorage, sessionKey);
}

function getVisitorId(): string {
  const identifier = localStorage.getItem(visitorKey);
  const createdAt = Number(localStorage.getItem(visitorCreatedKey));
  if (
    identifier &&
    createdAt &&
    Date.now() - createdAt < visitorDurationMs
  ) {
    return identifier;
  }
  const nextIdentifier = crypto.randomUUID();
  localStorage.setItem(visitorKey, nextIdentifier);
  localStorage.setItem(visitorCreatedKey, String(Date.now()));
  return nextIdentifier;
}

export function getAnalyticsConsent(): string | null {
  return localStorage.getItem(consentKey);
}

export type AnalyticsConsentState =
  | "accepted"
  | "rejected"
  | "unset"
  | "unknown";

export function subscribeToAnalyticsConsent(
  onChange: () => void,
): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(consentChangedEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(consentChangedEvent, onChange);
  };
}

export function getAnalyticsConsentSnapshot(): AnalyticsConsentState {
  try {
    const stored = getAnalyticsConsent();
    return stored === "accepted" || stored === "rejected" ? stored : "unset";
  } catch {
    return "unset";
  }
}

export function getServerAnalyticsConsentSnapshot(): AnalyticsConsentState {
  return "unknown";
}

export function saveAnalyticsConsent(choice: "accepted" | "rejected"): void {
  localStorage.setItem(consentKey, choice);
  window.dispatchEvent(new Event(consentChangedEvent));
}

export function clearAnalyticsIdentifiers(): void {
  localStorage.removeItem(visitorKey);
  localStorage.removeItem(visitorCreatedKey);
  sessionStorage.removeItem(sessionKey);
  sessionStorage.removeItem(sessionStartedKey);
  sessionStorage.removeItem(sessionSourceKey);
  sessionStorage.removeItem(engagedKey);
}

export function getEngagementAlreadyRecorded(): boolean {
  try {
    return sessionStorage.getItem(engagedKey) === "true";
  } catch (error) {
    console.error("Could not read the analytics engagement state:", error);
    return false;
  }
}

export function markEngagementRecorded(): void {
  try {
    sessionStorage.setItem(engagedKey, "true");
  } catch (error) {
    console.error("Could not save the analytics engagement state:", error);
  }
}

export function getVisitorAndSessionIds(): {
  visitor_id: string;
  session_id: string;
} {
  return {
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
  };
}

export function recordAnalyticsEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  let identifiers: ReturnType<typeof getVisitorAndSessionIds>;
  try {
    if (getAnalyticsConsent() !== "accepted") return;
    identifiers = getVisitorAndSessionIds();
  } catch (error) {
    console.error("Could not access analytics storage:", error);
    return;
  }

  void fetch(`${apiBaseUrl}/analytics/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...event, ...identifiers }),
    keepalive: true,
  })
    .then((response) => {
      if (!response.ok) {
        console.error("Analytics event was rejected:", response.status);
      }
    })
    .catch((error: unknown) => {
      console.error("Could not send an analytics event:", error);
    });
}

export function openAnalyticsPreferences(): void {
  window.dispatchEvent(new Event(preferencesEvent));
}

export function analyticsPreferencesEventName(): string {
  return preferencesEvent;
}

export function getSessionSource(): AnalyticsSource {
  let saved: string | null;
  try {
    getSessionId();
    saved = sessionStorage.getItem(sessionSourceKey);
  } catch (error) {
    console.error("Could not read the analytics traffic source:", error);
    return "direct";
  }
  if (
    saved === "direct" ||
    saved === "search" ||
    saved === "social" ||
    saved === "referral"
  ) {
    return saved;
  }

  const referrer = document.referrer;
  let source: AnalyticsSource = "direct";
  if (referrer) {
    try {
      const referrerUrl = new URL(referrer);
      if (referrerUrl.host !== window.location.host) {
        const host = referrerUrl.hostname.toLowerCase();
        if (/google\.|bing\.|yahoo\.|duckduckgo\./.test(host)) {
          source = "search";
        } else if (
          /facebook\.|instagram\.|tiktok\.|twitter\.|x\.com$|linkedin\.|youtube\.|whatsapp\./.test(
            host,
          )
        ) {
          source = "social";
        } else {
          source = "referral";
        }
      }
    } catch (error) {
      console.error("Could not classify the analytics referrer:", error);
    }
  }
  try {
    sessionStorage.setItem(sessionSourceKey, source);
  } catch (error) {
    console.error("Could not save the analytics traffic source:", error);
  }
  return source;
}

export function getDeviceCategory(): AnalyticsDevice {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/ipad|tablet|kindle|silk|android(?!.*mobile)/.test(userAgent)) {
    return "tablet";
  }
  return /mobi|iphone|ipod|android/.test(userAgent) ? "mobile" : "desktop";
}

export function normalizeTrackedPath(path: string): string {
  return path.replace(/^\/members\/[^/]+$/, "/members/[membershipId]");
}

export async function getWebsiteMetrics(
  days: number,
  signal?: AbortSignal,
): Promise<MetricsResponse> {
  const response = await api.get<MetricsResponse>("/admin/metrics", {
    params: { days },
    withCredentials: true,
    signal,
  });
  return response.data;
}
