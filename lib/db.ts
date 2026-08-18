import "server-only";
import { createClient } from "@supabase/supabase-js";

export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
    // Next.js patches fetch() to cache GET requests by default. Every read here
    // must be live — a stale cache would mean a revoked or expired link keeps
    // serving, and the links dashboard could show yesterday's view counts.
    global: { fetch: (url, opts) => fetch(url, { ...opts, cache: "no-store" }) },
  }
);
