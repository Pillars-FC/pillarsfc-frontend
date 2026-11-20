import Link from "next/link";
import ComingSoonButton from "./components/ComingSoonButton";
import LatestNews from "./components/LatestNews";
import Navbar from "./components/Navbar";
import NextTrainingDate from "./components/NextTrainingDate";
import QuoteOfTheDay from "./components/QuoteOfTheDay";
export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative min-h-140 overflow-hidden bg-[linear-gradient(90deg,rgba(3,23,43,.88)_20%,rgba(6,27,46,.55)_62%,rgba(6,27,46,.18)),url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1800&q=85')] bg-cover bg-center text-white">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_37px,rgba(255,255,255,.035)_38px_40px)]" />
          <div className="relative mx-auto max-w-360 px-7 py-24 sm:px-[8%]">

            <h1 className="mt-5 font-condensed text-7xl font-black leading-[.78] tracking-tight sm:text-8xl lg:text-[112px]">
              GREATNESS !!!
              <br />
            </h1>
            <p className="mt-7 max-w-120 text-sm leading-7 text-slate-200 sm:text-base">
              Welcome to the official home of Pillars Football Club. Follow every training, every story
              and every moment.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#fixtures"
                className="bg-[#f6b71d] px-5 py-3.5 text-xs font-extrabold text-[#152238]"
              >
                NEXT TRAINING
              </a>
              <Link href="/news" className="border border-white px-5 py-3.5 text-xs font-extrabold">
                LATEST NEWS
              </Link>
            </div>
          </div>
        </section>

        <QuoteOfTheDay />
        <section id="news" className="mx-auto max-w-310 px-6 py-20">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-500">FROM THE CLUB</p>
              <h2 className="font-condensed text-5xl font-extrabold uppercase leading-none text-[#071b33]">
                Latest News
              </h2>
            </div>
            <Link href="/news" className="text-xs font-extrabold tracking-wider text-[#075aa6]">
              VIEW ALL NEWS →
            </Link>
          </div>
          <LatestNews />
        </section>
        <section id="fixtures" className="bg-[#071b33] px-6 py-16 text-center text-white">
          <h2 className="font-condensed text-5xl font-extrabold uppercase">Next TRAINING</h2>
          <NextTrainingDate />
          <p className="mt-3 text-xs font-bold tracking-[.16em] text-slate-300">
            UNITY PARK • UDOUDOMA AVENUE • OPPOSITE CENTRAL BANK
          </p>

        </section>
        <section id="shop" className="mx-auto grid max-w-310 gap-6 px-6 py-20 md:grid-cols-2">
          <Promo
            title={
              <>
                Wear the
                <br />
                colours.
              </>
            }
            text="Explore the official 2026/27 collection and show your support wherever you are."
            action="VISIT CLUB SHOP"
          />
          <Promo
            gold
            title={
              <>
                Become a<br />
                member.
              </>
            }
            text="Get closer to the club with priority tickets, exclusive content and members-only events."
            action="JOIN THE FAMILY"
            href="/join"
          />
        </section>
      </main>
    </>
  );
}
function Promo({
  title,
  text,
  action,
  gold = false,
  href,
}: {
  title: React.ReactNode;
  text: string;
  action: string;
  gold?: boolean;
  href?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden p-9 text-white ${gold ? "bg-[linear-gradient(115deg,#322a16,#876617)]" : "bg-[linear-gradient(115deg,#075aa6,#021a34)]"}`}
    >
      <span className="absolute -bottom-20 -right-5 font-condensed text-[220px] font-black text-white/5">
        PFC
      </span>
      <h2 className="relative font-condensed text-5xl font-extrabold uppercase leading-[.84]">
        {title}
      </h2>
      <p className="relative mt-5 max-w-sm text-sm leading-6 text-slate-200">{text}</p>
      {href ? (
        <Link
          href={href}
          className="relative mt-6 inline-block bg-[#f6b71d] px-5 py-3 text-xs font-extrabold text-[#152238]"
        >
          {action}
        </Link>
      ) : (
        <div className="relative mt-6">
          <ComingSoonButton className="bg-[#f6b71d] px-5 py-3 text-xs font-extrabold text-[#152238]">
            {action}
          </ComingSoonButton>
          <span className="ml-3 text-[10px] font-extrabold tracking-wider text-amber-100">
            COMING SOON
          </span>
        </div>
      )}
    </div>
  );
}
