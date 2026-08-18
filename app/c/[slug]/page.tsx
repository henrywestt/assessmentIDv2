import { cookies } from "next/headers";
import { db } from "../../../lib/db";
import { verifyToken } from "../../../lib/auth";
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

  if (!payload || payload.slug !== params.slug) {
    return <Unlock slug={params.slug} clientName={link.client_name} />;
  }

  return (
    <Viewer
      raw={link.snapshot.raw}
      benchmarks={link.snapshot.benchmarks}
      title={link.title}
      readOnly
    />
  );
}
