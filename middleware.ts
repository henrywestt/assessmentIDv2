import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.SHARE_SECRET!);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("staff")?.value;
  if (token) {
    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {}
  }
  const url = req.nextUrl.clone();
  url.pathname = "/staff-login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/", "/links"],
};
