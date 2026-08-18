import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "../../../../../lib/db";
import { verifyToken } from "../../../../../lib/auth";
import { makePassword } from "../../../../../lib/slug";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const staff = cookies().get("staff")?.value;
  if (!staff || !(await verifyToken(staff))) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const password = makePassword();
  const password_hash = await bcrypt.hash(password, 10);

  const { error } = await db.from("share_links").update({ password_hash }).eq("slug", params.slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ password });
}
