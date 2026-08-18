import { cookies } from "next/headers";
import { db } from "../../../lib/db";
import { verifyToken, fingerprint } from "../../../lib/auth";
import Viewer from "../../../components/Viewer";
import Unlock from "../../../components/Unlock";
import Expired from "../../../components/Expired";

export const dynamic = "force-dynamic";

export default async function ClientView({ params }: { params: { slug: string } }) {
  const { data: link } = await db
    .from("share_links")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!link || link.revoked) return <Expired reason="This link is no longer active." />;
  if (new Date(link.expires_at) < new Date()) return <Expired reason="This link has expired." />;

  const token = cookies().get(`v_${params.slug}`)?.value;
  const payload = token ? await verifyToken(token) : null;

  // payload.ph ties the cookie to the password hash that was live when it was
  // issued — if staff resets the password, this stops matching and the
  // currently-open session is forced back to the unlock screen immediately,
  // rather than continuing to work for up to its remaining 8-hour lifetime.
  if (!payload || payload.slug !== params.slug || payload.ph !== fingerprint(link.password_hash)) {
    return <Unlock slug={params.slug} clientName={link.client_name} expiresAt={link.expires_at} />;
  }

  return (
    <Viewer
      raw={link.snapshot.raw}
      benchmarks={link.snapshot.benchmarks}
      title={link.title}
      readOnly
      clientName={link.client_name}
      generatedAt={link.created_at}
      expiresAt={link.expires_at}
      insights={link.snapshot.insights}
    />
  );
}
