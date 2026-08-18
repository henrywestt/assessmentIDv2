import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.SHARE_SECRET!);

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
