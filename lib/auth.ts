import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";

const secret = new TextEncoder().encode(process.env.SHARE_SECRET!);

// A short, one-way fingerprint of a bcrypt hash — safe to embed in a client
// cookie, unlike the hash itself. Changes whenever the password is reset, so
// a cookie signed against the old password stops verifying immediately.
export function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export async function signToken(payload: Record<string, unknown>, maxAgeSec: number) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSec)
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}
