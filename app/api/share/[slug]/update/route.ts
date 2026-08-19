import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "../../../../../lib/db";
import { verifyToken } from "../../../../../lib/auth";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const staff = cookies().get("staff")?.value;
  if (!staff || !(await verifyToken(staff))) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { raw, benchmarks, insights } = await req.json();
  if (!raw) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const { data: link, error: fetchError } = await db
    .from("share_links")
    .select("snapshot, version")
    .eq("slug", params.slug)
    .single();

  if (fetchError || !link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  // slug, password_hash, expires_at and revoked are deliberately left out of
  // this update — only the content and its version bookkeeping change.
  const { error } = await db
    .from("share_links")
    .update({
      previous_snapshot: link.snapshot,
      snapshot: { raw, benchmarks: benchmarks ?? null, insights: Array.isArray(insights) ? insights : [] },
      updated_at: new Date().toISOString(),
      version: (link.version || 1) + 1,
    })
    .eq("slug", params.slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
