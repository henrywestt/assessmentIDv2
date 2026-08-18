import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "../../../../../lib/db";
import { verifyToken } from "../../../../../lib/auth";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const staff = cookies().get("staff")?.value;
  if (!staff || !(await verifyToken(staff))) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { error } = await db.from("share_links").update({ revoked: true }).eq("slug", params.slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
