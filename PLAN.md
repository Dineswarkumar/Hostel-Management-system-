# HostelHub — Implementation Plan

> Detailed build plan: data model, APIs, milestones, performance budgets,
> testing, and deployment. Pairs with `README.md` (overview) and
> `WALKTHROUGH.md` (user journeys).

---

## 0. Confirmed assumptions (pre-build)

| Item | Default | Change via |
|---|---|---|
| Stack | Next.js 14 + Supabase + Razorpay | Ask before M1 |
| Scope | Single hostel first, multi-ready schema | Ask before M1 |
| Auth | Email + Google, role-based | Ask before M1 |
| Mobile | PWA, not native | Ask before M1 |
| Hosting | Vercel + Supabase | — |
| Real users? | TBD | Ask before M1 |

---

## 1. Full feature inventory

### 1.1 Core (must-have, M1–M4)

- [ ] Auth: signup, login, logout, password reset, email verify
- [ ] Role-based shells (4 roles, route guards, nav differences)
- [ ] Dashboard per role (data-driven widgets)
- [ ] Announcements: post, list, filter, pin, archive, push
- [ ] Complaints: raise, assign, track, resolve, rate
- [ ] Service requests: raise, schedule, track
- [ ] Fee management: structure, assign, pay (Razorpay), receipt
- [ ] Bus: routes, schedules, vote, request, admin override
- [ ] User management (admin): add, edit, deactivate, role assign

### 1.2 Strongly recommended (M5)

- [ ] Leave / outpass application + approval
- [ ] Mess menu + food rating
- [ ] Visitor log
- [ ] Document vault
- [ ] Email + push notifications
- [ ] Audit log

### 1.3 Nice-to-have (M6+)

- [ ] Room / bed allocation module
- [ ] Staff attendance + room inspection
- [ ] Polls / surveys (reusable voting engine)
- [ ] Gallery
- [ ] Reports + CSV export
- [ ] Multi-hostel support
- [ ] Super-admin: feature flags, role matrix, DB tools
- [ ] Lost & found
- [ ] Emergency contacts / SOS
- [ ] PWA offline queue

---

## 2. Data model (Prisma schema sketch)

```prisma
// prisma/schema.prisma — sketch, not final

model User {
  id              String   @id @default(cuid())
  email           String   @unique
  phone           String?
  name            String
  role            Role
  hostelId        String?
  roomId          String?
  parentPhone     String?
  avatarUrl       String?
  emailVerified   Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  // relations
  hostel          Hostel?  @relation(fields: [hostelId], references: [id])
  room            Room?    @relation(fields: [roomId], references: [id])
  complaints      Complaint[]
  serviceRequests ServiceRequest[]
  payments        Payment[]
  busVotes        BusVote[]
  busRequests     BusRequest[]
  leaves          Leave[]
  messRatings     MessRating[]
  documents       Document[]
}

enum Role {
  STUDENT
  STAFF
  ADMIN
  SUPER_ADMIN
}

model Hostel {
  id        String  @id @default(cuid())
  name      String
  address   String
  wardenId  String?
  blocks    Block[]
  rooms     Room[]
  users     User[]
}

model Block {
  id       String  @id @default(cuid())
  hostelId String
  name     String
  hostel   Hostel @relation(fields: [hostelId], references: [id])
  rooms    Room[]
}

model Room {
  id        String  @id @default(cuid())
  hostelId  String
  blockId   String?
  number    String
  floor     Int
  capacity  Int
  hostel    Hostel  @relation(fields: [hostelId], references: [id])
  block     Block?  @relation(fields: [blockId], references: [id])
  users     User[]
}

model Announcement {
  id           String   @id @default(cuid())
  title        String
  body         String
  postedById   String
  targetRole   Role?
  hostelId     String?
  pinned       Boolean  @default(false)
  priority     Priority @default(NORMAL)
  expiresAt    DateTime?
  createdAt    DateTime @default(now())
  postedBy     User     @relation(fields: [postedById], references: [id])
}

enum Priority { LOW NORMAL HIGH URGENT }

model Complaint {
  id           String         @id @default(cuid())
  userId       String
  category     ComplaintCategory
  title        String
  description  String
  photos       String[]
  priority     Priority       @default(NORMAL)
  status       ComplaintStatus @default(PENDING)
  assignedToId String?
  resolvedAt   DateTime?
  rating       Int?           // 1-5, post-resolution
  createdAt    DateTime       @default(now())
  user         User           @relation(fields: [userId], references: [id])
  assignedTo   User?          @relation("AssignedComplaints", fields: [assignedToId], references: [id])
  events       ComplaintEvent[]
}

enum ComplaintCategory { ELECTRICAL PLUMBING WIFI FURNITURE CLEANING OTHER }
enum ComplaintStatus  { PENDING ASSIGNED IN_PROGRESS RESOLVED CLOSED }

model ComplaintEvent {
  id          String   @id @default(cuid())
  complaintId String
  actorId     String
  type        String   // status_change, comment, photo_added
  payload     Json
  createdAt   DateTime @default(now())
  complaint   Complaint @relation(fields: [complaintId], references: [id])
}

model ServiceRequest {
  id           String   @id @default(cuid())
  userId       String
  type         String   // room_change, key_replacement, laundry, etc.
  details      String
  scheduledFor DateTime?
  status       String   @default("PENDING")
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id])
}

model FeeStructure {
  id        String   @id @default(cuid())
  name      String
  amount    Int      // paise
  components Json    // [{name, amount}]
  cadence   String   // MONTHLY, SEMESTER, ONE_TIME
  createdAt DateTime @default(now())
}

model Payment {
  id              String   @id @default(cuid())
  userId          String
  amount          Int
  status          PaymentStatus @default(PENDING)
  razorpayOrderId String?
  razorpayPaymentId String?
  receiptUrl      String?
  createdAt       DateTime @default(now())
  paidAt          DateTime?
  user            User     @relation(fields: [userId], references: [id])
}

enum PaymentStatus { PENDING PAID FAILED REFUNDED }

model Bus {
  id         String  @id @default(cuid())
  name       String
  plate      String
  driverName String?
  driverPhone String?
  schedules  BusSchedule[]
  votes      BusVote[]
  requests   BusRequest[]
}

model BusSchedule {
  id        String   @id @default(cuid())
  busId     String
  route     String
  days      String[] // ['MON','TUE',...]
  departure String   // '07:30'
  arrival   String   // '18:30'
  stops     Json     // [{name, time}]
  bus       Bus      @relation(fields: [busId], references: [id])
  votes     BusVote[]
}

model BusVote {
  id         String  @id @default(cuid())
  userId     String
  scheduleId String?
  requestId  String?
  type       VoteType
  createdAt  DateTime @default(now())
  user       User    @relation(fields: [userId], references: [id])
  schedule   BusSchedule? @relation(fields: [scheduleId], references: [id])
  request    BusRequest?  @relation(fields: [requestId], references: [id])
}

enum VoteType { UP DOWN }

model BusRequest {
  id           String  @id @default(cuid())
  userId       String
  proposedRoute String
  reason       String
  expectedStudents Int
  status       String  @default("OPEN")
  createdAt    DateTime @default(now())
  user         User    @relation(fields: [userId], references: [id])
  votes        BusVote[]
}

model Leave {
  id        String   @id @default(cuid())
  userId    String
  fromDate  DateTime
  toDate    DateTime
  reason    String
  status    LeaveStatus @default(PENDING)
  approverId String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

enum LeaveStatus { PENDING APPROVED REJECTED CANCELLED }

model MessMenu {
  id        String  @id @default(cuid())
  date      DateTime
  meals     Json    // {breakfast, lunch, snacks, dinner}
  ratings   MessRating[]
}

model MessRating {
  id        String  @id @default(cuid())
  userId    String
  menuId    String
  taste     Int
  quantity  Int
  hygiene   Int
  comment   String?
  createdAt DateTime @default(now())
  user      User   @relation(fields: [userId], references: [id])
  menu      MessMenu @relation(fields: [menuId], references: [id])
}

model Visitor {
  id        String   @id @default(cuid())
  studentId String
  name      String
  phone     String?
  inTime    DateTime
  outTime   DateTime?
  photoUrl  String?
}

model Document {
  id        String  @id @default(cuid())
  userId    String
  type      String  // RECEIPT, LEAVE_LETTER, ID, OTHER
  name      String
  url       String
  createdAt DateTime @default(now())
  user      User    @relation(fields: [userId], references: [id])
}

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String
  action    String
  entity    String
  entityId  String
  before    Json?
  after     Json?
  ip        String?
  createdAt DateTime @default(now())
}
```

---

## 3. API surface (route handlers)

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/api/auth/[...nextauth]` | any | Auth.js |
| GET | `/api/announcements` | any | List filtered by role |
| POST | `/api/announcements` | admin | Create |
| PATCH | `/api/announcements/:id` | admin | Update / pin / archive |
| GET | `/api/complaints` | any | List (filtered) |
| POST | `/api/complaints` | student | Create |
| PATCH | `/api/complaints/:id` | staff/admin | Update status / assign |
| POST | `/api/complaints/:id/events` | any | Comment |
| GET | `/api/buses` | any | List buses + schedules |
| POST | `/api/buses` | admin | Add bus |
| POST | `/api/bus-votes` | student | Vote |
| POST | `/api/bus-requests` | student | New route request |
| POST | `/api/payments/razorpay/order` | student | Create order |
| POST | `/api/payments/razorpay/verify` | student | Verify signature |
| POST | `/api/payments/webhook` | system | Razorpay webhook |
| GET | `/api/fees/me` | student | My dues |
| POST | `/api/leaves` | student | Apply |
| PATCH | `/api/leaves/:id` | admin | Approve / reject |
| POST | `/api/uploads` | any | Get signed upload URL |
| GET | `/api/users` | admin | List users |
| POST | `/api/users` | admin | Create user |
| GET | `/api/audit` | super | Audit log |

---

## 4. Milestones

### M1 — Foundation (week 1–2)
- Repo init: Next.js 14 + TS + Tailwind + shadcn/ui
- Auth.js setup with email + Google
- Role middleware + 4 empty role shells
- Glass nav + bottom tab bar (mobile)
- Skeleton loaders system
- Design tokens file (CSS variables)
- Dark mode default
- Deploy skeleton to Vercel

**Done when:** 4 roles can log in and see role-specific empty dashboard.

### M2 — Announcements + Users (week 3)
- Admin user CRUD
- Announcements module (post, list, pin, archive, target by role)
- Student/staff dashboard widgets
- Email notifications (Resend)
- Push notification opt-in

**Done when:** Admin posts an announcement, students see it on dashboard + email + push within 5s.

### M3 — Complaints + Service requests (week 4–5)
- Raise form (with photo upload)
- Staff assignment + status flow
- Live status updates (Supabase Realtime)
- Post-resolution rating
- Comment thread

**Done when:** Student raises complaint → staff assigned → student sees real-time status change → resolves → rates.

### M4 — Fees + Payments (week 6)
- Fee structure admin UI
- Razorpay integration (test mode)
- Webhook handler with signature verification
- Receipt PDF generation
- Document vault

**Done when:** Admin sets fee → student pays via Razorpay → receipt auto-generated + emailed.

### M5 — Bus module (week 7)
- Bus + schedule admin UI
- Student view + vote (Realtime)
- Bus request flow with upvoting
- "At risk" detection
- Admin override

**Done when:** Student votes → live count updates → admin sees aggregated data → can override.

### M6 — Polish + Admin extras (week 8+)
- Leave module
- Mess menu + rating
- Visitor log
- Reports + CSV export
- Audit log
- Super-admin: feature flags, role matrix
- PWA polish + offline queue
- Performance pass
- Security audit (OWASP top 10)

---

## 5. Performance budget

| Metric | Target | How |
|---|---|---|
| LCP (mobile 4G) | < 2.0s | SSR, image optimization, preload critical fonts |
| FID / INP | < 100ms | Minimal JS on first paint, defer non-critical |
| CLS | < 0.05 | Reserve sizes for skeletons, font preload |
| JS bundle (initial) | < 150KB gz | Server components, code-split by route |
| TTI | < 2.5s | Same as above |
| API response (p95) | < 200ms | Edge functions, indexed queries, Redis cache for hot reads |
| Vote roundtrip | < 100ms | Optimistic UI + Supabase Realtime |
| Payment verify | < 3s | Razorpay standard |

Lighthouse targets: Performance > 90, Accessibility > 95, Best Practices > 95, SEO > 90.

---

## 6. Testing strategy

| Layer | Tool | Coverage |
|---|---|---|
| Unit | Vitest | Lib functions, utilities, validators (80%+) |
| Component | Testing Library + Vitest | UI components, especially forms |
| Integration | Vitest + MSW | API route handlers, webhook flows |
| E2E | Playwright | Critical journeys: signup, pay fee, vote, raise + resolve complaint |
| Visual | Chromatic / Percy | Glass / neu / skeuo surfaces regression |
| A11y | axe-core (CI) | All pages |
| Performance | Lighthouse CI | PR-level perf check |

CI: GitHub Actions — lint, typecheck, test, build, lighthouse, deploy preview.

---

## 7. Security

- All routes server-side role-guarded (don't trust client)
- CSRF protection on mutations (Auth.js + double-submit cookie)
- Razorpay signature verification on every webhook
- Signed URLs for file uploads (never trust client file paths)
- Rate limiting on auth + payment endpoints (Upstash Redis)
- Input validation with Zod on every route
- SQL injection prevented by Prisma parameterized queries
- XSS prevented by React + sanitized rich text (DOMPurify for announcements)
- Secrets in env vars only, never in repo
- Dependency audit weekly (`pnpm audit`)
- Audit log for every admin mutation

---

## 8. Accessibility

- WCAG 2.1 AA target
- Keyboard nav for everything (focus rings, skip links)
- ARIA labels on glass surfaces (some have low contrast by design — provide
  text alternative)
- Screen reader announcements for status changes (live regions)
- Reduced motion: respect `prefers-reduced-motion`, disable spring animations
- Color is never the only signal (status icons + color)
- Min 4.5:1 text contrast in both modes

---

## 9. Deployment & environments

| Env | Purpose | URL |
|---|---|---|
| Local | Dev | `localhost:3000` |
| Preview | Per-PR | `hostelhub-pr-<n>.vercel.app` |
| Staging | Pre-prod testing | `staging.hostelhub.app` |
| Prod | Live | `hostelhub.app` |

- DB: separate Supabase projects per env
- Razorpay: test mode for non-prod, live keys in Vercel env (encrypted)
- Branch → preview auto-deploy via Vercel
- Main → prod (manual approval OR auto after checks pass)
- Migrations: `prisma migrate deploy` runs in CI before deploy

---

## 10. Observability

- **Logs:** Vercel logs + Axiom (free tier) for search
- **Errors:** Sentry (free tier), with source maps
- **Analytics:** Plausible, self-hosted or cloud
- **Uptime:** UptimeRobot, free tier, public status page
- **Perf:** Vercel Analytics + Web Vitals

---

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Razorpay webhook delivery flakiness | Fallback: client polls order status for 30s |
| Real-time connection drops | Optimistic UI + reconnect with backoff + last-known-state |
| Glassmorphism perf on low-end mobile | Conditional rendering: detect low-memory devices, fall back to solid bg |
| Scope creep | Stick to M1–M4 for v1, treat M5–M6 as v1.1 |
| Single dev bottleneck | Document everything, write runbook for handover |
| Multi-hostel data leakage | Enforce `hostelId` in every Prisma query at service layer |
| Payment reconciliation drift | Daily cron to reconcile Razorpay vs DB |

---

## 12. Open questions for you

1. **Stack** — Next.js + Supabase + Razorpay OK?
2. **Scope** — single hostel or multi from day 1?
3. **Real users** — going live soon or portfolio project?
4. **Project name** — keep "HostelHub" or different?
5. **Color palette** — the deep-blue + warm-amber proposed, or different?
6. **Mobile** — PWA enough, or will you want React Native later?
7. **Hosting** — OK to use Vercel (your code will be on their infra)?
8. **Auth** — email+Google enough, or do you need college SSO?
9. **Budget** — free tiers OK to start, or willing to pay for Supabase Pro / Resend / etc.?
10. **Languages** — English only or multi-lingual (Hindi/regional)?

Once you answer these, I lock the plan and start **M1** the same day.
