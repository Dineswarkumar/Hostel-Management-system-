# HostelHub — User Walkthrough

> Screen-by-screen journeys for all 4 roles. ASCII wireframes show the
> layout intent; final visuals use the glassmorphism / neumorphism / skeuomorphism
> mix described in the README.

Legend used in wireframes:
- `[ ]` = button / clickable
- `( )` = radio / toggle
- `─` = glass surface
- `▣` = input field
- `▤` = card
- `★` = active / selected
- `→` = flow direction

---

## 0. Common shell (every screen)

```
┌─────────────────────────────────────────────────────────────┐
│  [HostelHub]      Dashboard  Fees  Bus  Complaints  ⋯    🔔 👤 │  ← frosted nav
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              [ page content area — glass surfaces ]         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  © HostelHub  ·  Help  ·  Privacy  ·  Contact              │  ← minimal footer
└─────────────────────────────────────────────────────────────┘
```

- Top nav: glass (backdrop-blur 20px, 70% opacity, 1px border)
- Mobile: nav collapses to bottom tab bar with 4 icons + hamburger for more
- All actions show **skeleton** within 100ms, then content streams in
- Toasts: bottom-right (desktop) / bottom-center (mobile), spring-in

---

## 1. Auth flow (all roles)

### 1.1 Sign in

```
            ┌──────────────────────────────┐
            │  [ mesh-gradient background ] │
            │                                │
            │     Welcome back              │
            │                                │
            │   ▣ Email                      │
            │   ▣ Password               👁  │
            │                                │
            │   [  Sign in  ]   ← skeuo CTA  │
            │   ─────── or ───────           │
            │   [ G  Continue with Google ]  │
            │                                │
            │   Forgot password? · Sign up   │
            └──────────────────────────────┘
```

- After submit: button shows shimmer animation, then 3-way router
  (student / staff / admin / super)
- Glass card on mesh-gradient background
- Wrong credentials: input fields shake (3 cycles, 80ms each), red glow

### 1.2 First-time signup (student)

- 3-step glass-stepper: **Account → Profile → Room**
- Step 1: email, password, confirm
- Step 2: name, phone, parent phone, photo upload
- Step 3: hostel + room number (auto-suggested by admin, or self-pick if open)
- Email verification link before dashboard unlock

### 1.3 Role detection

- On signup: domain allowlist OR invitation code
  - `admin@<hostel>.in` → admin shell
  - `<anything>` + valid student invite code → student shell
  - Staff added by admin only, no public signup
- Developer shell: special env-protected route, no public link

---

## 2. Student journey

### 2.1 Dashboard

```
┌──────────────────────────────────────────────────────┐
│  Hey, Aarav 👋         [Day 47 of semester]          │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ Fee due     │  │ Open        │  │ Bus in 24m   │ │  ← glass cards
│  │ ₹4,500      │  │ complaints  │  │ Route 3      │ │
│  │ [ Pay now ] │  │ 2           │  │ [ Track ]    │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
│                                                       │
│  📢 Announcements                                     │
│  ▤ Water tank cleaning — Sun 10am                     │
│  ▤ Cricket trials — Fri 5pm                           │
│  ▤ Fee due date extended to 15th   [read more]        │
│                                                       │
│  🗳️ Bus voting open                                   │
│  Should Route 7 run on Saturday?  [ Yes  ]  [ No ]    │
│  Live: 142 yes · 38 no · 2 days left                  │
│                                                       │
│  🍽️ Today's mess menu + [ Rate meal ]                 │
│                                                       │
└──────────────────────────────────────────────────────┘
```

- All cards: glass + 1px border + soft shadow
- Live vote count updates without refresh (Supabase Realtime)
- Bus "in 24m" auto-counts down, color shifts amber → red

### 2.2 Fee payment

```
┌──────────────────────────────────────────────┐
│  Hostel fee — July 2026                       │
├──────────────────────────────────────────────┤
│  Room rent          ₹3,000                   │
│  Mess charges       ₹1,500                   │
│  Maintenance        ₹   500                  │
│  ───────────────────────────                  │
│  Total due          ₹5,000                   │
│                                               │
│  Due in 5 days                                 │
│                                               │
│  [   Pay ₹5,000 via Razorpay   ]  ← skeuo   │
│                                               │
│  Last paid: 5 Jun 2026  [ view receipt ]      │
└──────────────────────────────────────────────┘
```

- Click "Pay": Razorpay modal opens (UPI / Card / Netbanking / Wallet)
- On success: full-screen skeuomorphic **"Payment successful"** card with
  confetti, auto-downloads PDF receipt, sends email
- Receipts stored in document vault

### 2.3 Bus module

#### Schedule

```
┌──────────────────────────────────────────────────┐
│  Bus schedules                       [ Filter ▾ ]│
├──────────────────────────────────────────────────┤
│  Route 1 — City Center ↔ Hostel                 │
│   Mon–Fri  7:30 AM  ·  6:30 PM                  │
│   Sat      9:00 AM                             │
│   ▣ Available?  [ 👍 248 ]  [ 👎 12 ]            │
│                                                   │
│  Route 3 — Railway Stn ↔ Hostel                  │
│   Mon–Sat  6:45 AM  ·  8:15 PM                  │
│   ▣ Available?  [ 👍 195 ]  [ 👎 28 ]            │
│   ⚠ Only 12 students confirm — at risk           │
│                                                   │
│  [ + Request new route ]                         │
└──────────────────────────────────────────────────┘
```

- Vote buttons: neumorphic, press animates scale + color burst on click
- Vote count updates live without reload
- "At risk" badge: amber pulse, only when downvotes > 25% threshold

#### New route request

- Form: proposed stops (multi-input), reason, expected students
- Goes to admin queue, students can upvote others' requests

### 2.4 Raise complaint

```
┌──────────────────────────────────────────────┐
│  New complaint                                │
├──────────────────────────────────────────────┤
│  Category  ( ) Electrical                    │
│           ( ) Plumbing                       │
│           (★) WiFi                            │
│           ( ) Furniture                      │
│           ( ) Cleaning                       │
│           ( ) Other                           │
│                                               │
│  Title    ▣ WiFi drops in room 204           │
│  Details  ▤                                  │
│            ▤                                  │
│  Photos   [ + Upload ]  (up to 3)            │
│  Priority ( ) Low  (★) Medium  ( ) Urgent    │
│                                               │
│  [ Submit ]   [ Save draft ]                 │
└──────────────────────────────────────────────┘
```

- After submit: glass toast "Submitted — ticket #C-2489", live status pill
  shows `Pending → Assigned → In progress → Resolved`
- Each status change pushes a notification

### 2.5 Service request

- Same shape as complaint but pre-defined categories (room change, key
  replacement, laundry, etc.) and a date picker

### 2.6 Apply for leave

- From → To dates, reason, parent contact (auto-filled), emergency contact
- Admin/warden approves, parent gets email + SMS, on return student
  one-tap "Returned" check-in

### 2.7 Mess feedback

- Daily: 3 emoji ratings (taste, quantity, hygiene) + optional comment
- Weekly summary visible to admin

### 2.8 Announcements

- Filtered feed: general / hostel / personal (admin-targeted)
- Pinned items stay on top
- Mark as read, push notification for new high-priority items

### 2.9 Document vault

- Fee receipts, leave letters, ID copies, bonafide requests
- Download anytime, share via signed URL (24h expiry)

---

## 3. Staff journey

### 3.1 Dashboard

```
┌──────────────────────────────────────────────────┐
│  My tasks — today                                 │
├──────────────────────────────────────────────────┤
│  ▤ #C-2487  WiFi router reset, 2nd floor    [ → ] │
│  ▤ #C-2490  Leaking tap, room 118         [ → ] │
│  ▤ Inspection Block B, 3pm                [ → ] │
│  ──────────                                      │
│  Visitors today: 4    Attendance: 18/22         │
└──────────────────────────────────────────────────┘
```

- Task card: glass, drag-to-update status, "→ Open" opens detail with
  photos, location, "Mark done" skeuomorphic button
- Completion animates: card slides right, struck-through, fades to bottom

### 3.2 Visitor log

- Quick entry: name, phone, student visited, in-time (auto)
- Out-time: one tap from the entry, photo optional

### 3.3 Attendance

- Block-wise list, toggle present/absent, auto-save on toggle
- Bulk "Mark all present" with confirm

### 3.4 Room inspection

- Pick room → checklist (bed, fan, lights, cleanliness, fixtures)
- Score auto-calculated, photos attach to negatives
- One report per room per month (re-opening allowed with reason)

---

## 4. Administration journey

### 4.1 Dashboard

```
┌──────────────────────────────────────────────────┐
│  Today's snapshot                                 │
├──────────────────────────────────────────────────┤
│  Occupancy  86%    Fee collected  72%             │
│  Open tickets  14  Pending leaves 3              │
│  Bus availability   4/5 routes green             │
│  ──────────                                       │
│  Quick actions                                    │
│  [ + Announcement ]  [ + Bus route ]             │
│  [ + Fee structure ]  [ + Student ]              │
└──────────────────────────────────────────────────┘
```

### 4.2 User management

- Table: students / staff / admins, filters, bulk actions
- Add user: glass modal, multi-step form
- Deactivate (preserves history, blocks login)

### 4.3 Announcements

- Compose: title, body (rich text), target audience, expiry, priority
- Schedule for later or post now
- Pin to top, archive old

### 4.4 Bus management

- Add bus, add route, set schedule
- View live vote counts, override schedule based on data
- Approve / reject student route requests

### 4.5 Fee management

- Create fee structure (per month / per semester / custom)
- Assign to students individually or by hostel/block/room
- Track paid / unpaid / overdue
- Export CSV

### 4.6 Reports

- Fee collection by month / hostel
- Complaint categories breakdown
- Bus utilization
- Mess food ratings trend
- Export PDF / CSV

---

## 5. Developer (super-admin) journey

### 5.1 System overview

- Live stats: server health, DB size, active users, error rate
- Recent audit log (last 50 actions, full text search)

### 5.2 Role & permission management

- Visual matrix: role × feature → allow / deny
- Add custom role if needed (e.g. "Warden")

### 5.3 Feature flags

- Toggle features on/off per hostel (e.g. enable mess module for Hostel A
  only)
- Beta flags for new modules

### 5.4 Audit log

- Every admin action logged: who, what, when, IP, before/after
- Filter by user, action type, date

### 5.5 Database tools

- Read-only query interface (sanitized)
- Schema browser
- Backup triggers

---

## 6. Mobile experience highlights

- **Bottom tab bar** (mobile): Home · Bus · Complaints · Fees · More
- **Swipe gestures**: swipe complaint card → "Mark done" / "Snooze"
- **Pull to refresh** on every list
- **Haptic feedback** on vote, payment success, status change
  (Vibration API, no native app needed)
- **PWA installable** — "Add to Home Screen" prompt after 2nd visit
- **Offline queue** — complaints and votes queue locally, sync on reconnect

---

## 7. Edge cases covered

| Case | Handling |
|---|---|
| Two students vote same option twice | One vote per user per item, server-side check |
| Payment succeeds but webhook fails | Client polls status; if 30s no webhook, fallback server poll |
| Bus driver cancels last minute | Admin marks "cancelled", all students who voted get push |
| Student loses phone / session expired | One-tap "Logout all devices" from settings |
| Admin deletes announcement by mistake | Soft delete + trash bin, recoverable 30 days |
| Fee overpaid | Auto-credit to next month, visible in ledger |
| Complaint without category | Defaults to "Other", gets tagged for triage |
| Multi-hostel admin | Switcher in top nav, scoped permissions |

---

Review this and the PLAN.md — let me know what to add, cut, or change.
