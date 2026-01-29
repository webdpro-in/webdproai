import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const BACKEND_FETCH_TIMEOUT_MS = 55_000;

function json(status: number, body: { success: boolean; error?: string; data?: unknown }) {
   return NextResponse.json(body, { status });
}

function errMsg(data: { error?: string; details?: string } | null): string | null {
   const e = typeof data?.error === "string" ? data.error.trim() : "";
   const d = typeof data?.details === "string" ? data.details.trim() : "";
   if (e) return e;
   if (d) return d;
   return null;
}

export async function POST(request: NextRequest) {
   if (!API_BASE || !API_BASE.startsWith("http")) {
      return json(503, { success: false, error: "API URL not configured. Set NEXT_PUBLIC_API_URL in .env.local." });
   }

   let body: Record<string, unknown>;
   try {
      body = await request.json();
   } catch {
      return json(400, { success: false, error: "Invalid JSON in request body." });
   }

   const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
   if (!prompt) {
      return json(400, { success: false, error: "Prompt is required." });
   }

   const storeType = typeof body?.storeType === "string" ? body.storeType : "general";
   const language = typeof body?.language === "string" ? body.language : "en";
   const currency = typeof body?.currency === "string" ? body.currency : "INR";

   const auth = request.headers.get("authorization") || request.headers.get("Authorization");
   const headers: Record<string, string> = { "Content-Type": "application/json" };
   if (auth) headers["Authorization"] = auth;

   const ac = new AbortController();
   const timeout = setTimeout(() => ac.abort(), BACKEND_FETCH_TIMEOUT_MS);

   let res: Response;
   try {
      res = await fetch(`${API_BASE}/stores/generate`, {
         method: "POST",
         headers,
         body: JSON.stringify({ prompt, storeType, language, currency }),
         signal: ac.signal,
      });
   } catch (e) {
      clearTimeout(timeout);
      const msg = e instanceof Error ? e.message : "Request failed";
      const isAbort = e instanceof Error && e.name === "AbortError";
      console.error("[api/generate] Backend fetch failed:", isAbort ? "timeout" : msg);
      return json(503, {
         success: false,
         error: isAbort
            ? "Backend request timed out. Try again."
            : "Cannot reach backend. Check NEXT_PUBLIC_API_URL and that the backend is deployed.",
      });
   }
   clearTimeout(timeout);

   let data: { store?: Record<string, unknown>; error?: string; details?: string } = {};
   let rawText = "";
   try {
      rawText = await res.text();
      data = rawText ? JSON.parse(rawText) : {};
   } catch {
      if (!res.ok) {
         console.error("[api/generate] Backend !ok and non-JSON:", res.status, rawText.slice(0, 300));
      }
      return json(502, {
         success: false,
         error: "Backend returned invalid response. Check backend logs or try again.",
      });
   }

   if (!res.ok) {
      const fromBackend = errMsg(data);
      const fallback =
         res.status === 401
            ? "Unauthorized. Please log in."
            : res.status === 403
               ? "Forbidden. Ensure you're logged in and have access."
               : "Generation failed. Try again or ensure you're logged in.";
      const err = fromBackend || fallback;
      if (process.env.NODE_ENV !== "production") {
         console.warn("[api/generate] Backend !ok:", res.status, fromBackend || "(no error message)");
      }
      return json(res.status >= 500 ? 502 : res.status, { success: false, error: err });
   }

   const store = data?.store;
   if (!store || typeof store !== "object") {
      return json(502, { success: false, error: "Invalid response from generation service." });
   }

   return json(200, {
      success: true,
      data: {
         ...store,
         config: (store as { config?: unknown }).config ?? {},
      },
   });
}
