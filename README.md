# HostelHub

> Modern hostel management platform — students, staff, administration, developer.
> Built with Next.js 14, TypeScript, Tailwind. Glassmorphism / neumorphism / skeuomorphism UI.

**Status:** v0.1 — Frontend complete with mock data. Phase 2 = real backend (Supabase + Razorpay).

---

## Quick start

```bash
# 1. install
npm install

# 2. run dev server
npm run dev

# 3. open
# http://localhost:3000
```

That's it. No env vars required for the mock layer.

Deployment link --- https://hostel-management-system-ml8f.onrender.com/

### Demo accounts

Click any of these on the sign-in screen (or paste the email + password `demo1234`):

| Role | Email |
|---|---|
| Student | `student@hostelhub.in` |
| Staff | `staff@hostelhub.in` |
| Administration | `admin@hostelhub.in` |
| Developer | `dev@hostelhub.in` |

---

## What's in v0.1

| Feature | Status | Where |
|---|---|---|
| Landing page (hero, features, rooms, roles) | ✅ | `/` |
| Sign in + sign up (2-step with role pick) | ✅ | `/signin`, `/signup` |
| 4 role-based dashboards | ✅ | `/dashboard` |
| Announcements (post, pin, delete — for staff/admin) | ✅ | `/announcements` |
| Complaints (raise, list, status flow) | ✅ | `/complaints`, `/complaints/new` |
| Bus schedules + voting + route requests | ✅ | `/bus` |
| Mess menu + dish catalog + ratings | ✅ | `/mess` |
| Fees (pay, history, outstanding card) | ✅ | `/fees` |
| User management (admin/super) | ✅ (read-only) | `/admin/users` |
| Super-admin system panel | ✅ (read-only) | `/admin/system` |
| Profile + settings | ✅ | `/account`, `/account/settings` |
| Mess REST API | ✅ | `/api/mess/today`, `/api/mess/dishes`, `/api/mess/menu/[date]` |
| 5 room types catalog | ✅ | `src/features/rooms/catalog.ts` |

Phase 2 (next): real auth (Auth.js), Supabase DB, Razorpay payments, file uploads, real-time, push notifications, leave module, audit log.

---

## Architecture — built for "no bugs when we add features"

The whole app is organized as **self-contained feature modules** with a swappable service layer.

```
src/features/
├── auth/           types + service + hooks + role guard
├── announcements/  types + service
├── complaints/     types + service
├── bus/            types + service
├── mess/           types + service + dish catalog
├── fees/           types + service
└── rooms/          catalog (5 room types)
```

Each `service.ts` is a mock that exposes the **same interface** the real API
will expose. To wire the real backend later, you swap the implementation —
not a single component needs to change.

Example — adding a new room type:

```ts
// src/features/rooms/catalog.ts
{
  id: "PENTHOUSE",
  name: "Penthouse Suite",
  shortName: "Penthouse",
  capacity: 1,
  basePricePerMonth: 18000,
  description: "Top floor suite with private terrace.",
  amenities: ["King bed", "AC", "Private terrace", "Jacuzzi"],
  badge: "premium",
  emoji: "🌃",
}
```

That's it. The landing page, room picker, fee calculator — they all read from
the catalog and pick it up automatically. No schema migration, no breakage.

Example — adding a new announcement:

```ts
await announcementsService.create({
  title: "...",
  body: "...",
  postedById: user.id,
  postedByName: user.name,
  priority: "HIGH",
  pinned: true,
});
```

It's instantly visible to the right audience, ordered correctly, and animates in.

---

## Design system

The UI is built on three design styles, used with restraint:

| Style | Where | Examples |
|---|---|---|
| **Glassmorphism** | Cards, nav, modals | `glass`, `glass-strong`, `glass-subtle` |
| **Neumorphism** | Toggles, soft surfaces, vote buttons | `neu`, `neu-inset`, `neu-sm` |
| **Skeuomorphism** | Primary CTAs, highlights | `skeuo-btn`, `skeuo-btn-accent` |
| **Mesh gradients** | Page backgrounds | `.mesh-bg` |

All visual primitives are CSS classes in `src/app/globals.css` and configured in
`tailwind.config.ts`. Dark mode is the default; tokens switch automatically.

### Motion

- `< 100ms` for any hover/press feedback
- `framer-motion` for orchestrated page transitions
- `prefers-reduced-motion` honored globally

---

## Project structure

```
.
├── README.md                # this file
├── PLAN.md                  # full build plan
├── WALKTHROUGH.md           # screen-by-screen user journeys
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.example
└── src/
    ├── app/
    │   ├── layout.tsx               # root: Auth + Toast providers, mesh bg
    │   ├── page.tsx                 # landing page
    │   ├── globals.css              # design tokens + base styles
    │   ├── not-found.tsx            # 404
    │   ├── (auth)/                  # signin / signup — centered card layout
    │   ├── (app)/                   # authed: glass nav + bottom tabs
    │   │   ├── layout.tsx
    │   │   ├── dashboard/page.tsx
    │   │   ├── announcements/page.tsx
    │   │   ├── complaints/
    │   │   │   ├── page.tsx
    │   │   │   └── new/page.tsx
    │   │   ├── bus/page.tsx
    │   │   ├── mess/page.tsx
    │   │   ├── fees/page.tsx
    │   │   ├── account/
    │   │   │   ├── page.tsx
    │   │   │   └── settings/page.tsx
    │   │   └── admin/
    │   │       ├── users/page.tsx
    │   │       └── system/page.tsx
    │   └── api/
    │       └── mess/
    │           ├── today/route.ts          # GET today's menu
    │           ├── dishes/route.ts         # GET catalog (?q=)
    │           └── menu/[date]/route.ts    # GET menu for date
    ├── components/
    │   ├── ui/                     # primitives (Button, Card, Input, ...)
    │   ├── glass/                  # glass surface wrapper
    │   └── shared/                 # TopNav, BottomTabs, AppShell
    ├── features/                   # ★ feature modules — see architecture
    └── lib/
        ├── config.ts               # app-wide config
        └── utils.ts                # cn, formatters
```

---

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build
npm run start       # start production
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
```

---

## API (v0.1)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/mess/today` | Today's menu with resolved dish details |
| `GET` | `/api/mess/dishes?q=paneer` | Search dish catalog |
| `GET` | `/api/mess/menu/2026-07-15` | Menu for a specific date |

The Mess module uses the real API in v0.1 — the page tries `/api/mess/today`
first, falls back to the in-memory mock if the API fails. You'll see a
`via API` badge in the UI when the real endpoint is hit.

---

## How to add a new feature (the recipe)

1. **Create the module** under `src/features/<name>/`:
   - `types.ts` — TS interfaces
   - `service.ts` — mock service (same shape as future real API)
   - `index.ts` — public exports
   - `components/` — feature-specific components (optional)

2. **Wire the data hooks** — use `useState` + `useEffect` with the service.
   Replace the body when real API lands; UI doesn't change.

3. **Add a page** under `src/app/(app)/<route>/page.tsx` and wrap content in
   `<RoleGuard allow={[...]}>...</RoleGuard>`.

4. **Add nav entries** in `src/components/shared/top-nav.tsx` and
   `src/components/shared/bottom-tabs.tsx` for the relevant roles.

5. **Done.** No schema migration, no breaking change.

---

## What needs Phase 2 (real backend)

These are stubbed in v0.1 and need wiring to be production-ready:

- [ ] Auth.js (NextAuth) replacing mock service
- [ ] Supabase Postgres + Prisma
- [ ] Razorpay test + live keys
- [ ] Supabase Storage for complaint photos
- [ ] Supabase Realtime for live vote counts & status updates
- [ ] Resend for transactional email
- [ ] Web Push (VAPID) for browser push
- [ ] Real file uploads (signed URLs)
- [ ] Audit log
- [ ] Leave / outpass module
- [ ] Super-admin: feature flags, role matrix, DB tools

See `PLAN.md` for the full milestone breakdown.

---

## Accessibility

- Keyboard navigable, visible focus rings
- ARIA labels on icon-only buttons
- `prefers-reduced-motion` honored
- Color + icon + text for status (never color alone)
- WCAG 2.1 AA contrast in both modes

---

## Performance

- Server-rendered, code-split per route
- Glass surfaces are GPU-accelerated (`backdrop-filter`)
- Skeletons show within 100ms, content streams in
- Bundle size target: < 150KB gz initial

---

