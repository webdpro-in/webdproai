# WebDPro AI – Project Analysis & Status

**Last updated:** January 2026  
**Scope:** Structure, APIs, URLs, connections, errors, and 10-year maintainability.

---

## 1. Project overview

**WebDPro AI** is a prompt-to-ecommerce SaaS platform. Users describe a business in natural language; the system generates a full e‑commerce site (HTML/CSS, images, config) via AWS Bedrock, stores it in S3, and serves it via CloudFront.

### Core flow

```
User (Frontend) → Login (Cognito) → Dashboard → Generate Store
       ↓
Frontend POST /stores/generate (with JWT) → Backend Lambda
       ↓
Backend → AI Service POST /ai/generate (input, tenantId, storeId)
       ↓
AI Service → Bedrock (spec → code → images) → S3 upload → response
       ↓
Backend → DynamoDB store record, S3 draft → response to Frontend
       ↓
User sees preview_url, can publish (→ live S3 + CloudFront).
```

---

## 2. Repository structure

| Folder | Role |
|--------|------|
| **frontend** | Next.js 14+ App Router app. Login, dashboard, generate, stores, owner flows. |
| **backend** | Serverless (Lambda + API Gateway). Auth, stores, orders, domains, payments hooks. |
| **ai_services** | Serverless. Single pipeline: POST /ai/generate → Bedrock → S3. |
| **inventory** | Serverless. Products, stock, low-stock, predictions. |
| **payments** | Serverless. Checkout, subscription, onboarding, Razorpay webhooks. |
| **delivery** | Serverless. Assignments, tracking, cash. |
| **orders** | Thin layer (referenced in structure). |
| **docs** | Architecture, flows, DynamoDB, errors, pipeline. |

---

## 3. APIs and URLs

### Base URLs (from README-WEBDPRO / deployed)

| Service | Base URL | Notes |
|---------|----------|--------|
| Backend | `https://7ix42khff8.execute-api.eu-north-1.amazonaws.com/dev` | Core API |
| AI | `https://l0wi495th5.execute-api.eu-north-1.amazonaws.com/dev` | Generation |
| Inventory | `https://e4wbcrjlc7.execute-api.eu-north-1.amazonaws.com/dev` | Optional |
| Payments | `https://0mxwvl3n6i.execute-api.eu-north-1.amazonaws.com/dev` | Optional |
| CloudFront | `https://d3qhkomcxcxmtl.cloudfront.net` | App + generated sites |

### Frontend env (.env.local)

- `NEXT_PUBLIC_API_URL` → Backend base.
- `NEXT_PUBLIC_AI_URL` → AI base (for direct ai/generate usage if any).
- `NEXT_PUBLIC_PAYMENTS_URL` → Payments base (optional).
- `NEXT_PUBLIC_INVENTORY_URL` → Inventory base (optional).

### Main connections

- **Frontend → Backend:** `apiStores`, `apiAuth`, `apiOrders` use `API_BASE_URL`. Token from `localStorage` sent as `Authorization: Bearer <token>`.
- **Backend → AI:** `AI_SERVICE_URL` + `/ai/generate`. Body: `{ input, tenantId, storeId, mode? }`. No user JWT; server-to-server.
- **Owner create / Generate / Sites new:** Use `POST /api/generate` (Next.js API route). Route forwards to Backend `POST /stores/generate` with body and `Authorization` forwarded.

### Generation mode (reliable vs Bedrock)

- **Default:** Backend sends `mode: 'fallback'` to AI. AI uses **template-based generation only** (no Bedrock). Completes in seconds and avoids API Gateway ~29s timeout. Use this for reliable, always-working generation.
- **Optional Bedrock:** Set `AI_USE_BEDROCK=true` (backend env). Backend omits `mode: 'fallback'`; AI tries Bedrock first, then fallback on error. Bedrock can exceed gateway timeout; use only if you’ve increased integration timeout or switched to async generation.

---

## 4. What’s working

- **Generate flow:** Frontend → Backend `/stores/generate` → AI `/ai/generate` → Bedrock → S3 → response. End-to-end path is wired.
- **Auth:** Cognito (OTP + Google). Login, callback, token storage. Dashboard protected.
- **Stores CRUD:** Create (generate), list, get, update, publish. Publish copies draft to live S3.
- **Orders:** Create, list by store, status updates.
- **DynamoDB:** Tables exist (users, tenants, stores, products, orders, payments, delivery). Backend uses them.
- **S3:** Backend and AI use configured buckets (e.g. `webdpro-ai-storage-dev`, `webdpro-websites-ai-gen-dev`). Upload paths aligned.
- **Bedrock:** AI service uses Bedrock with fallbacks (e.g. Nova Pro → Claude Haiku → Llama → templates). Pipeline and orchestrator implemented.

---

## 5. Known issues and fixes applied

### 5.1 Build / runtime

- **`useSearchParams` without Suspense (Next.js 15):**  
  - **Issue:** `/auth/callback` used `useSearchParams` without Suspense → prerender error.  
  - **Fix:** Callback page now wraps the component that uses `useSearchParams` in `<Suspense>`. Build succeeds.

- **Missing `/api/generate`:**  
  - **Issue:** Owner create called `POST /api/generate`, but no Next.js API route existed → 404.  
  - **Fix:** Added `app/api/generate/route.ts` that forwards to Backend `POST /stores/generate` with body and `Authorization`. Owner create sends `Authorization` from `localStorage` and handles 401 (redirect to login) and errors.

- **Next.js lockfile / tracing warning:**  
  - **Issue:** Multiple lockfiles caused tracing root warning.  
  - **Fix:** `outputFileTracingRoot` set in `next.config.js` (frontend root) to pin tracing.

### 5.2 Frontend API client

- **SSR:** `localStorage` only used in `getToken()` when `typeof window !== "undefined"`. Avoids SSR crashes.
- **Missing base URLs:** `fetchAPI` checks `url.startsWith("http")`. Payments/Inventory helpers throw clear errors if their base URL is not set.
- **Env:** `.env.template` updated with `NEXT_PUBLIC_AI_URL`, `NEXT_PUBLIC_PAYMENTS_URL`, `NEXT_PUBLIC_INVENTORY_URL`.

### 5.3 Cognito / Google (from aws-diagnostic)

- **Cognito domain / Google IdP:** Diagnostic reported `domainExists: false`, `googleProviderConfigured: false`.  
- **Action:** In AWS Cognito, create domain for the user pool and configure Google as identity provider. Add the required redirect URIs in Google Cloud Console (see README-WEBDPRO). Until then, Google login will not work.

### 5.4 API Gateway “errors” (403 / 502)

- **403 on GET /** for Backend / AI / Inventory / Payments: Expected. Those services expect POST (and often auth). GET without auth is correctly rejected.
- **502 on GET /stores:** Can occur when hitting a path that requires auth or POST. Use proper POST + `Authorization` from the frontend.

### 5.5 Other

- **Delivery:** `tracking.ts` typing fix (e.g. `STATUS_FLOW` arrays as `string[]`) was already applied per `PROJECT_ERRORS_REPORT`.
- **Orders:** Possible type/config issues in `orders` (see `PROJECT_ERRORS_REPORT`). Isolate `tsconfig` / `node_modules` if you hit build or type errors there.
- **Frontend lint:** ESLint reported various issues. Cleanup is optional but recommended over time.

---

## 6. How to run and verify

1. **Env:** Copy `.env.template` → `frontend/.env.local` and backend `.env`. Fill URLs and secrets (Cognito, Google, Razorpay, etc.).
2. **Backend / AI / etc.:** Deploy via Serverless from each service directory (`backend`, `ai_services`, …). Ensure `AI_SERVICE_URL` and `S3_BUCKET` (and related) match what AI and backend use.
3. **Frontend:** `cd frontend && npm i && npm run dev`. Open `http://localhost:3000`.
4. **Login:** Use OTP (or Google once Cognito + Google are configured). Then open **Generate** or **Owner → Create**.
5. **Generate:** Use Generate page (or Owner create with prompt). Confirm request goes to Backend → AI → Bedrock → S3, and preview URL works.

---

## 7. Checklist for “everything working”

- [ ] `.env` / `.env.local` set for frontend and backend with correct API URLs.
- [ ] Cognito domain created and Google IdP configured; redirect URIs added in Google Console.
- [ ] Backend and AI deployed; `AI_SERVICE_URL` and S3 buckets consistent.
- [ ] Frontend build passes (`npm run build` in `frontend`).
- [ ] Login works (OTP or Google).
- [ ] Generate flow works (Generate page and/or Owner create).
- [ ] Optional: Payments and Inventory env vars set if you use those UIs.

---

## 8. References

- `README-WEBDPRO.md` – AWS setup, URLs, quick start.  
- `COMPLETE_GUIDE.md` – Generation flow, auth, troubleshooting.  
- `docs/WEBDPRO_COMPLETE_FLOW.md` – End‑to‑end flows.  
- `docs/AI_GENERATION_PIPELINE.md` – AI pipeline and model roles.  
- `docs/PROJECT_ERRORS_REPORT.md` – Past errors and fixes.  
- `docs/FUTURE_PROOFING.md` – Long‑term maintenance and upgrades.
