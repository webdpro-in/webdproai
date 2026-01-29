import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * GET /api/health
 * Checks backend reachability. 401/403 = reachable (auth required). 200 = ok. 5xx / network = unreachable.
 */
export async function GET() {
   if (!API_BASE || !API_BASE.startsWith("http")) {
      return NextResponse.json(
         { ok: false, backend: "unconfigured", error: "NEXT_PUBLIC_API_URL not set" },
         { status: 503 }
      );
   }

   const ac = new AbortController();
   const timeout = setTimeout(() => ac.abort(), 10_000);

   try {
      const res = await fetch(`${API_BASE}/stores`, {
         method: "GET",
         headers: { "Content-Type": "application/json" },
         signal: ac.signal,
      });
      clearTimeout(timeout);
      const status = res.status;
      if (status === 200 || status === 401 || status === 403) {
         return NextResponse.json({ ok: true, backend: "reachable", status });
      }
      const text = await res.text().catch(() => "");
      return NextResponse.json(
         { ok: false, backend: "error", status, detail: text.slice(0, 200) },
         { status: 502 }
      );
   } catch (e) {
      clearTimeout(timeout);
      const msg = e instanceof Error ? e.message : "unknown";
      const aborted = e instanceof Error && e.name === "AbortError";
      return NextResponse.json(
         {
            ok: false,
            backend: "unreachable",
            error: aborted ? "timeout" : msg,
         },
         { status: 503 }
      );
   }
}
