import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "../../../lib/db";
import { signToken } from "../../../lib/auth";

export async function POST(req: Request) {
  const { slug, password } = await req.json();

  const { data: link } = await db
    .from("share_links")
    .select("password_hash, expires_at, revoked, view_count")
    .eq("slug", slug)
    .single();

  if (!link || link.revoked || new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: "Link unavailable" }, { status: 404 });
  }

  const ok = await bcrypt.compare(password || "", link.password_hash);
  if (!ok) {
    await new Promise(r => setTimeout(r, 600));  // slow brute force
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await signToken({ slug }, 60 * 60 * 8);
  cookies().set(`v_${slug}`, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: `/c/${slug}`,
    maxAge: 60 * 60 * 8,
  });

  await db.from("share_links")
    .update({ last_viewed_at: new Date().toISOString(), view_count: link.view_count + 1 })
    .eq("slug", slug);

  return NextResponse.json({ ok: true });
}
