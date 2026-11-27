"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { getAdminSession } from "../../lib/admin";
import {
  getWebsiteMetrics,
  type MetricsResponse,
} from "../../lib/analytics";

const periods = [7, 30, 90] as const;
type Period = (typeof periods)[number];

function formatLabel(value: string): string {
  return value.replaceAll("_", " ");
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <article className="bg-white p-5 shadow-[0_6px_26px_rgba(13,35,50,.06)]">
      <p className="text-[10px] font-extrabold tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-condensed text-4xl font-black text-[#071b33]">
        {value}
      </p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </article>
  );
}

function MetricPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white p-6 shadow-[0_6px_26px_rgba(13,35,50,.06)] sm:p-8">
      <h2 className="font-condensed text-3xl font-extrabold uppercase text-[#071b33]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function TrendChart({
  title,
  data,
  field,
}: {
  title: string;
  data: MetricsResponse["daily"];
  field:
    | "views"
    | "visitors"
    | "applications"
    | "members"
    | "subscriptions"
    | "articles"
    | "api_requests";
}) {
  const maximum = Math.max(1, ...data.map((item) => item[field]));
  return (
    <MetricPanel title={title}>
      <div
        className="mt-6 flex h-40 items-end gap-1 border-b border-l border-slate-200 px-2"
        role="img"
        aria-label={`${title} over the selected period`}
      >
        {data.map((item) => (
          <div
            key={item.date}
            title={`${item.date}: ${item[field]}`}
            className="min-w-0 flex-1 bg-[#075aa6] hover:bg-[#f6b71d]"
            style={{
              height: `${(item[field] / maximum) * 100}%`,
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-500">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </MetricPanel>
  );
}

function Breakdown({
  items,
  emptyMessage,
}: {
  items: { name: string; count: number }[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="mt-5 text-sm text-slate-500">{emptyMessage}</p>;
  }
  const maximum = Math.max(1, ...items.map((item) => item.count));
  return (
    <ul className="mt-5 space-y-4">
      {items.map((item) => (
        <li key={item.name}>
          <div className="flex justify-between gap-4 text-sm">
            <span className="truncate capitalize text-slate-600">
              {formatLabel(item.name)}
            </span>
            <span className="font-bold text-[#071b33]">{item.count}</span>
          </div>
          <div className="mt-2 h-2 bg-slate-100">
            <div
              className="h-full bg-[#075aa6]"
              style={{ width: `${(item.count / maximum) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PageList({
  items,
  emptyMessage,
}: {
  items: { path: string; views: number }[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="mt-5 text-sm text-slate-500">{emptyMessage}</p>;
  }
  return (
    <ol className="mt-5 space-y-3">
      {items.map((item, index) => (
        <li
          key={item.path}
          className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm last:border-0"
        >
          <span className="min-w-0 truncate text-slate-600">
            <span className="mr-3 font-bold text-slate-400">{index + 1}.</span>
            {item.path}
          </span>
          <span className="shrink-0 font-bold text-[#071b33]">{item.views}</span>
        </li>
      ))}
    </ol>
  );
}

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [period, setPeriod] = useState<Period>(30);
  const [loadedPeriod, setLoadedPeriod] = useState<Period | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const isLoading = loadedPeriod !== period;

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    getAdminSession()
      .then(() => {
        if (!isMounted) return;
        setIsAuthenticated(true);
        return getWebsiteMetrics(period, controller.signal).then((result) => {
          if (isMounted) setMetrics(result);
        });
      })
      .catch((requestError: unknown) => {
        if (!isMounted || controller.signal.aborted) return;
        if (
          axios.isAxiosError(requestError) &&
          requestError.response?.status === 401
        ) {
          setIsAuthenticated(false);
          return;
        }
        console.error("Failed to load website metrics:", requestError);
        setError("Metrics could not be loaded. Please try again.");
      })
      .finally(() => {
        if (isMounted) setLoadedPeriod(period);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [period]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <p className="text-[11px] font-extrabold tracking-[.16em] text-[#075aa6]">
          CLUB ADMINISTRATION
        </p>
        <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-condensed text-6xl font-black uppercase leading-[.82] text-[#071b33] sm:text-7xl">
              Website Metrics
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
              Website activity, membership growth, content performance, and API
              health. Website analytics include only visitors who opt in.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/members"
              className="border border-slate-200 px-4 py-3 text-xs font-extrabold text-[#075aa6]"
            >
              MANAGE MEMBERS
            </Link>
            <Link
              href="/admin/applications"
              className="border border-slate-200 px-4 py-3 text-xs font-extrabold text-[#075aa6]"
            >
              APPLICATIONS
            </Link>
            <Link
              href="/admin/news"
              className="border border-slate-200 px-4 py-3 text-xs font-extrabold text-[#075aa6]"
            >
              MANAGE NEWS
            </Link>
          </div>
        </div>

        <section className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            {metrics
              ? `Showing ${metrics.period.days} days from ${metrics.period.start.slice(0, 10)}`
              : "Select a reporting period"}
          </p>
          <label className="flex items-center gap-3 text-xs font-bold text-slate-600">
            REPORTING PERIOD
            <select
              value={period}
              onChange={(event) => {
                const value = Number(event.currentTarget.value);
                const selectedPeriod = periods.find((option) => option === value);
                if (selectedPeriod !== undefined) {
                  setError("");
                  setPeriod(selectedPeriod);
                }
              }}
              className="border border-slate-200 bg-white px-3 py-2 text-sm text-[#071b33]"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
        </section>

        {isLoading ? (
          <p className="mt-8 bg-white p-8 text-center text-sm text-slate-500" aria-live="polite">
            Loading metrics...
          </p>
        ) : !isAuthenticated ? (
          <section className="mt-8 bg-white p-8 text-center">
            <p className="text-sm text-slate-600">
              Sign in to view website metrics.
            </p>
            <Link
              href="/admin/members"
              className="mt-5 inline-block bg-[#075aa6] px-5 py-3 text-xs font-extrabold text-white"
            >
              ADMIN SIGN IN
            </Link>
          </section>
        ) : error ? (
          <p role="alert" className="mt-8 bg-white p-6 text-sm text-red-700">
            {error}
          </p>
        ) : metrics ? (
          <div className="mt-8 space-y-8">
            <section aria-label="Audience overview" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="PAGE VIEWS" value={metrics.audience.page_views} />
              <MetricCard label="VISITORS" value={metrics.audience.visitors} detail="Opted-in browsers" />
              <MetricCard label="NEW VISITORS" value={metrics.audience.new_visitors} />
              <MetricCard label="RETURNING VISITORS" value={metrics.audience.returning_visitors} />
              <MetricCard label="SESSIONS" value={metrics.audience.sessions} />
              <MetricCard label="ENGAGED SESSIONS" value={metrics.audience.engaged_sessions} detail="At least 10 seconds active" />
              <MetricCard label="ACTIVE MEMBERS" value={metrics.membership.active_members} />
              <MetricCard label="APPLICATIONS" value={metrics.membership.applications_submitted} detail={`${metrics.membership.application_conversion_percent}% tracked submit rate`} />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <TrendChart title="Daily page views" data={metrics.daily} field="views" />
              <TrendChart title="Daily opted-in visitors" data={metrics.daily} field="visitors" />
              <TrendChart title="Daily applications" data={metrics.daily} field="applications" />
              <TrendChart title="Daily member additions" data={metrics.daily} field="members" />
              <TrendChart title="Daily event subscriptions" data={metrics.daily} field="subscriptions" />
              <TrendChart title="Daily news published" data={metrics.daily} field="articles" />
              <TrendChart title="Daily API requests" data={metrics.daily} field="api_requests" />
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <MetricPanel title="Traffic sources">
                <Breakdown items={metrics.audience.sources} emptyMessage="No opted-in visits recorded for this period." />
              </MetricPanel>
              <MetricPanel title="Devices">
                <Breakdown items={metrics.audience.devices} emptyMessage="No opted-in visits recorded for this period." />
              </MetricPanel>
              <MetricPanel title="Top pages">
                <PageList items={metrics.audience.top_pages} emptyMessage="No opted-in visits recorded for this period." />
              </MetricPanel>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <MetricPanel title="Membership overview">
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MetricCard label="TOTAL MEMBERS" value={metrics.membership.total_members} />
                  <MetricCard label="INACTIVE MEMBERS" value={metrics.membership.inactive_members} />
                  <MetricCard label="APPLICATION STARTS" value={metrics.membership.application_starts} />
                  <MetricCard label="APPROVAL RATE" value={`${metrics.membership.approval_rate_percent}%`} />
                  <MetricCard label="AVG. REVIEW TIME" value={`${metrics.membership.average_review_hours}h`} />
                </div>
                <h3 className="mt-7 text-xs font-extrabold tracking-wider text-slate-500">APPLICATION STATUS</h3>
                <Breakdown
                  items={Object.entries(metrics.membership.applications_by_status).map(([name, count]) => ({ name, count }))}
                  emptyMessage="No applications yet."
                />
              </MetricPanel>
              <MetricPanel title="Preferred positions">
                <Breakdown items={metrics.membership.positions} emptyMessage="No member position data yet." />
              </MetricPanel>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <MetricPanel title="Community">
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MetricCard label="SUBSCRIBERS" value={metrics.community.subscribers} />
                  <MetricCard label="NEW SUBSCRIBERS" value={metrics.community.new_subscribers} />
                  <MetricCard label="CONTACT MESSAGES" value={metrics.community.contact_submissions} />
                  <MetricCard label="QUIZ COMPLETIONS" value={metrics.community.quiz_completions} />
                </div>
              </MetricPanel>
              <MetricPanel title="News content">
                <MetricCard label="PUBLISHED ARTICLES" value={metrics.content.published_articles} />
                <h3 className="mt-7 text-xs font-extrabold tracking-wider text-slate-500">ARTICLE CATEGORIES</h3>
                <Breakdown items={metrics.content.categories} emptyMessage="No news categories yet." />
              </MetricPanel>
              <MetricPanel title="Most-read articles">
                <PageList items={metrics.content.top_articles} emptyMessage="No opted-in article views recorded." />
              </MetricPanel>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <MetricPanel title="API health">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <p className="mt-5 text-sm font-bold capitalize text-emerald-700">
                    {metrics.health.api_status}
                  </p>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MetricCard label="REQUESTS" value={metrics.health.api_requests} />
                  <MetricCard label="SUCCESS RATE" value={`${metrics.health.api_success_percent}%`} />
                  <MetricCard label="FAILED REQUESTS" value={metrics.health.failed_requests} />
                  <MetricCard label="SERVER ERRORS" value={metrics.health.api_errors} />
                  <MetricCard label="SLOW REQUESTS" value={metrics.health.slow_requests} detail="Over 1 second" />
                  <MetricCard label="AVG. API RESPONSE" value={`${metrics.health.average_response_ms} ms`} />
                  <MetricCard label="BROWSER ERRORS" value={metrics.health.client_errors} />
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Request history begins when metrics collection is deployed; this is not an external uptime monitor.
                </p>
              </MetricPanel>
              <MetricPanel title="Core Web Vitals">
                {metrics.health.web_vitals.length === 0 ? (
                  <p className="mt-5 text-sm text-slate-500">
                    No opted-in performance measurements recorded for this period.
                  </p>
                ) : (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-extrabold tracking-wider text-slate-500">
                          <th className="py-3">METRIC</th>
                          <th className="py-3">AVERAGE</th>
                          <th className="py-3">SAMPLES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.health.web_vitals.map((vital) => (
                          <tr key={vital.name} className="border-b border-slate-100 last:border-0">
                            <th className="py-3 font-bold text-[#071b33]">{vital.name}</th>
                            <td className="py-3 text-slate-600">
                              {vital.name === "CLS" ? vital.average : `${vital.average} ms`}
                            </td>
                            <td className="py-3 text-slate-600">{vital.samples}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </MetricPanel>
            </section>
          </div>
        ) : null}
      </main>
    </>
  );
}
