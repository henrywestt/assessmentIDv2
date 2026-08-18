import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "../../../lib/db";
import { makeSlug, makePassword } from "../../../lib/slug";
import { cookies } from "next/headers";
import { verifyToken } from "../../../lib/auth";

export async function POST(req: Request) {
  // staff-only
  const staff = cookies().get("staff")?.value;
  if (!staff || !(await verifyToken(staff))) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { clientName, title, raw, benchmarks, days } = await req.json();

  if (!clientName || !raw) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const password = makePassword();
  const password_hash = await bcrypt.hash(password, 10);
  const slug = makeSlug(clientName);
  const expires_at = new Date(Date.now() + (days || 30) * 86400_000).toISOString();

  const { error } = await db.from("share_links").insert({
    slug,
    client_name: clientName,
    title: title || clientName,
    snapshot: { raw, benchmarks: benchmarks ?? null },
    password_hash,
    expires_at,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ slug, password, expires_at });
}
