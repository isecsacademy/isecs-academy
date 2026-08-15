# ISECS Academy Management System

Web counterpart to the offline desktop app. Next.js + TypeScript + Tailwind +
shadcn/ui, backed by Supabase (Postgres/Auth/RLS/Storage), deployed on Netlify.

## 1. Supabase setup

1. Create a project at https://supabase.com (or use an existing one).
2. Open **SQL Editor > New query**, paste the contents of
   `supabase/schema.sql`, and run it. This creates every table, the
   business-logic functions (`impose_head_on_all_students`,
   `add_manual_charge`, strike-off/result guard triggers, etc.), the
   dashboard views, RLS policies, and two Storage buckets (`photos`,
   `branding`).
3. Go to **Authentication > Providers** and confirm Email is enabled.
4. Go to **Authentication > Users** and manually create your first admin
   user (email + password) — there's no public sign-up page by design.
5. Go to **Settings > API** and copy:
   - `Project URL`
   - `anon public` key

## 2. Local environment variables

Copy `.env.example` to `.env.local` and fill in the two values from step 1.5:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Install and run locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000 — you should be redirected to `/login`
(middleware protects every route except `/login`).

## 4. Netlify deployment

1. Push this repo to GitHub.
2. In Netlify: **Add new site > Import an existing project**, pick the repo.
3. Build settings (Netlify auto-detects Next.js, but to confirm):
   - Build command: `next build`
   - Publish directory: `.next`
   - The official `@netlify/plugin-nextjs` plugin is auto-installed — no
     extra config needed for the App Router, middleware, or Server Actions.
4. **Site settings > Environment variables**, add the same two variables
   from step 2 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
5. Deploy. Every push to your main branch redeploys automatically.

## 5. Logo / branding

`public/logo.png` is your uploaded academy logo. It's wired in as a static
asset — once we build the Auth and layout modules I'll drop it into the
navbar, login page, favicon, and the PDF header/watermark components.

## Project structure so far

```
app/
  layout.tsx        — root layout, page metadata
  globals.css        — Tailwind + CSS variables (brand colors)
  page.tsx           — dashboard placeholder (real version built next)
  login/page.tsx      — login placeholder (Auth module built next)
lib/
  supabase/
    client.ts        — browser Supabase client
    server.ts         — server Supabase client (Server Components/Actions)
  utils.ts            — cn() helper for shadcn/ui
middleware.ts          — session refresh + route protection
supabase/
  schema.sql          — full DB schema, functions, triggers, views, RLS
public/
  logo.png            — your uploaded logo
```

## What's next

Per the build order you specified: **Auth → Dashboard → Teachers → Programs
→ Students**, then the fee system, then Results/Strike-Off, then
Attendance, then Reports — confirming each works before moving on.

Say the word and I'll build out the Auth module (real sign-in form, session
handling, sign-out) on top of this scaffold.
