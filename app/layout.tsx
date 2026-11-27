import { Suspense } from "react";
import type { Metadata } from "next";
import { Barlow_Condensed, DM_Sans } from "next/font/google";
import "./globals.css";
import AnalyticsTracker from "./components/AnalyticsTracker";
import Footer from "./components/Footer";

const condensed = Barlow_Condensed({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});
const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://pillarsfc.vercel.app",
  ),
  title: "Pillars Football Club",
  description: "The official home of Pillars Football Club.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${condensed.variable} ${sans.variable} bg-[#f7f8fa] font-sans text-[#101d2c] flex min-h-screen flex-col`}
      >
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
