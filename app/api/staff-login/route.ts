import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signToken } from "../../../lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json();

  const ok = await bcrypt.compare(password || "", process.env.STAFF_PASSWORD_HASH!);
  if (!ok) {
    await new Promise(r => setTimeout(r, 600));  // slow brute force
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await signToken({ staff: true }, 60 * 60 * 24 * 7);
  cookies().set("staff", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
