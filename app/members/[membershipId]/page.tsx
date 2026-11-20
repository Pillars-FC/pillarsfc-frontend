import { Suspense } from "react";
import MemberDetailClient from "./member-detail-client";

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-4xl px-6 py-16 text-center text-sm text-slate-500">
          Loading member profile...
        </main>
      }
    >
      <MemberDetailPageContent params={params} />
    </Suspense>
  );
}

async function MemberDetailPageContent({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  return <MemberDetailClient membershipId={membershipId} />;
}
