import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "../../../../../lib/db";
import { verifyToken } from "../../../../../lib/auth";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const staff = cookies().get("staff")?.value;
  if (!staff || !(await verifyToken(staff))) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data: link, error: fetchError } = await db
    .from("share_links")
    .select("previous_snapshot, version")
    .eq("slug", params.slug)
    .single();

  if (fetchError || !link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }
  if (!link.previous_snapshot) {
    return NextResponse.json({ error: "No previous version to revert to" }, { status: 400 });
  }

  // The undo is single-level — only one previous_snapshot is ever kept, so it's
  // cleared after use rather than swapped, which is what "disabled when null"
  // on the dashboard button means in practice.
  const { error } = await db
    .from("share_links")
    .update({
      snapshot: link.previous_snapshot,
      previous_snapshot: null,
      updated_at: new Date().toISOString(),
      version: Math.max(1, (link.version || 1) - 1),
    })
    .eq("slug", params.slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
