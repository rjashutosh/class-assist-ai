# ClassAssist AI — Complete Architecture

Use this document to understand the app structure and to fix issues. All paths are relative to the repo root unless noted.

---

## 1. High-level overview

- **Monorepo**: npm workspaces with two packages, `client` and `server`.
- **Backend**: Node.js, Express, TypeScript, Prisma, SQLite. Single process, no separate workers.
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Framer Motion. SPA with client-side routing.
- **Auth**: JWT in `Authorization: Bearer <token>`. Token stored in `localStorage` on the client.
- **Voice flow**: Browser (Web Speech API + SpeechSynthesis) → transcript → `/api/intent/extract` → confirmation UI → `/api/execute` → step UI + voice feedback.

---

## 2. Monorepo layout

```
class-assist-ai/
├── package.json              # Workspaces: client, server; scripts: dev, dev:client, dev:server, db:*
├── client/                   # React SPA
│   ├── index.html            # Entry HTML, loads /src/main.tsx
│   ├── src/
│   │   ├── main.tsx          # React entry, mounts App with BrowserRouter
│   │   ├── App.tsx           # AuthProvider, Routes, PrivateRoute, RoleRedirect
│   │   ├── index.css         # Tailwind + global styles
│   │   ├── context/          # AuthContext (user, login, logout, refresh)
│   │   ├── components/       # Layout, VoicePanel, ConfirmationModal, ExecutionPanel, UpgradeModal
│   │   ├── pages/            # Login, Dashboard, Students, Calendar, Notifications, Admin
│   │   ├── lib/              # api.ts (fetch wrapper + auth/intent/execute/students/classes/admin/notifications), speech.ts
│   │   └── types/            # api.ts (User, Role, Class, Student, ExtractedIntent, etc.)
│   ├── vite.config.ts        # Proxy /api → localhost:3001
│   ├── tailwind.config.js
│   └── tsconfig.json
├── server/                   # Express API
│   ├── src/
│   │   ├── index.ts          # Express app entry: cors, json, route mounts, /api/me, /health, 404, error handler
│   │   ├── middleware/       # auth.ts (authMiddleware, requireRoles, createToken)
│   │   ├── routes/           # auth, intent, execute, students, classes, admin, notifications, subscription
│   │   ├── orchestration/    # types.ts, commandOrchestrator.ts (executeCommand, mapCommandResultToHttp)
│   │   ├── services/         # classService.ts, subscription.ts, notificationService.ts
│   │   ├── ai/               # AIProvider interface, OpenAIProvider, LocalLLMProvider, getAIProvider()
│   │   ├── lib/              # prisma.ts (singleton PrismaClient)
│   │   └── types/            # intent.ts (SUPPORTED_INTENTS, ExtractedIntent, etc.)
│   ├── prisma/
│   │   ├── schema.prisma     # SQLite; Account, User, Student, Class, Notification
│   │   └── seed.ts
│   ├── .env / .env.example   # DATABASE_URL, PORT, JWT_SECRET, AI_MODE, OPENAI_API_KEY
│   └── tsconfig.json
└── README.md
```

---

## 3. Backend architecture

### 3.1 Entry and app setup

| File | Role |
|------|------|
| `server/src/index.ts` | Loads `dotenv`, creates Express app, uses cors + express.json(), mounts all API routes, defines GET `/api/me` and GET `/health`, 404 handler, global error handler (console.error + 500), listens on PORT. |

### 3.2 Route mount points (all under `/api`)

| Mount path | Router file | Purpose |
|------------|-------------|---------|
| `/api/auth` | `routes/auth.js` | POST `/register`, POST `/login` |
| `/api/intent` | `routes/intent.js` | POST `/extract` — AI intent extraction |
| `/api/execute` | `routes/execute.js` | POST `/` — run command (schedule/cancel/reschedule/add_student/send_reminder) |
| `/api/students` | `routes/students.js` | GET `/`, POST `/` |
| `/api/classes` | `routes/classes.js` | GET `/`, GET `/:id` |
| `/api/admin` | `routes/admin.js` | POST `/accounts`, POST `/users`, GET `/accounts`, GET `/usage` (all ADMIN) |
| `/api/notifications` | `routes/notifications.js` | GET `/` |
| `/api/subscription` | `routes/subscription.js` | GET `/limits` |

So full URLs are e.g. `POST /api/auth/login`, `POST /api/intent/extract`, `POST /api/execute`, etc.

### 3.3 Middleware

| File | Exports | Role |
|------|---------|------|
| `server/src/middleware/auth.ts` | `authMiddleware`, `requireRoles`, `createToken`, `JwtPayload` | Reads `Authorization: Bearer <token>`, verifies JWT with `JWT_SECRET`, loads user (with account) from DB, sets `req.user`. `requireRoles(...roles)` ensures `req.user.role` is in the list (else 403). |

- **No auth**: `POST /api/auth/login`, `POST /api/auth/register`.
- **Auth only**: `GET /api/me` (uses `authMiddleware`).
- **Auth + role**: All other routes use `authMiddleware` and then `requireRoles("ADMIN")` or `requireRoles("TEACHER", "MANAGER")`.

### 3.4 Execute flow (command pipeline)

1. **Route** (`server/src/routes/execute.ts`):
   - Validates body with Zod `executeSchema`.
   - Short-circuits with 403 if `!user.accountId`.
   - Calls `executeCommand({ userId, accountId }, body)` then `mapCommandResultToHttp(result)` and sends `res.status(status).json(json)`.
   - Catches ZodError → 400, other → 500.

2. **Orchestrator** (`server/src/orchestration/commandOrchestrator.ts`):
   - Loads **account once** (with `include: { students: true }`).
   - Builds `ExecuteContext` (userId, accountId, account) and passes it to classService (classService does **not** load account again).
   - Dispatches by `body.intent` to the correct classService method.
   - Returns `CommandResult`: either `{ success: true, data }` or `{ success: false, error: CommandError }`.
   - `mapCommandResultToHttp(result)` maps that to HTTP status and JSON body (exhaustive switch on `error.code`; no change to current API response shapes).

3. **Class service** (`server/src/services/classService.ts`):
   - `scheduleClass`, `cancelClass`, `rescheduleClass`, `addStudent`, `sendReminders` each take `(ctx: ExecuteContext, body: ExecuteCommandBody)`.
   - Use only `ctx.account` and `ctx.accountId` / `ctx.userId` (no account fetch).
   - Use `prisma`, `canCreateClass` / `canSendReminder` (subscription), `createMockNotification` (notificationService).
   - Return success payload or **throw** a `CommandError` object; orchestrator catches and returns `{ success: false, error }`.

4. **Types** (`server/src/orchestration/types.ts`):
   - `ExecuteContext`, `ExecuteCommandBody`, `CommandError` (7 codes, no NO_ACCOUNT), `CommandSuccessData`, `CommandResult`, `AccountWithStudents`, `ClassWithStudent`.

### 3.5 Other services

| File | Role |
|------|------|
| `server/src/services/subscription.ts` | `getClassesCountThisMonth`, `canCreateClass`, `canSendReminder` (BASIC vs PRO limits). |
| `server/src/services/notificationService.ts` | `createMockNotification(accountId, type, recipient, message)` — inserts into Notification table (no real delivery). |

### 3.6 AI layer

| File | Role |
|------|------|
| `server/src/ai/AIProvider.ts` | Interface: `extractIntent(text: string) => Promise<ExtractedIntent>`. |
| `server/src/ai/OpenAIProvider.ts` | Implements with OpenAI API; strict prompt; returns structured intent or unsupported. |
| `server/src/ai/LocalLLMProvider.ts` | Stub; returns unsupported (for future local LLM). |
| `server/src/ai/index.ts` | `getAIProvider()`: reads `AI_MODE` and `OPENAI_API_KEY`, returns OpenAI or Local provider. |

Used only by `routes/intent.ts` (POST `/extract`).

### 3.7 Database

| File | Role |
|------|------|
| `server/prisma/schema.prisma` | SQLite; models: Account, User, Student, Class, Notification. No enums (strings). |
| `server/src/lib/prisma.ts` | Single `new PrismaClient()` export. |
| `server/prisma/seed.ts` | Creates admin, demo account, teacher, manager, demo student. |

- **DATABASE_URL** is used by Prisma (schema + generated client). Loaded via `dotenv` in `index.ts` before any Prisma use.
- **No explicit connection check**; first Prisma call will fail if DB is unavailable. `/health` does not hit the DB.

---

## 4. Frontend architecture

### 4.1 Entry and routing

| File | Role |
|------|------|
| `client/index.html` | Loads `/src/main.tsx` as module. |
| `client/src/main.tsx` | Renders `<BrowserRouter><App /></BrowserRouter>` into `#root`. |
| `client/src/App.tsx` | Wraps app in `AuthProvider`. Defines `Routes`: `/login`, `/` (Layout with nested routes), `*` → redirect. Uses `PrivateRoute` (auth + optional role check) and `RoleRedirect` (ADMIN → /admin, else → /dashboard). |

### 4.2 Routes (client-side)

| Path | Component | Access |
|------|-----------|--------|
| `/login` | `Login` | Public |
| `/` | `Layout` + outlet | Authenticated |
| `/` (index) | `RoleRedirect` | — |
| `/dashboard` | `Dashboard` | TEACHER, MANAGER |
| `/students` | `Students` | TEACHER, MANAGER |
| `/calendar` | `Calendar` | TEACHER, MANAGER |
| `/notifications` | `Notifications` | TEACHER, MANAGER |
| `/admin` | `Admin` | ADMIN |

### 4.3 Auth and API

| File | Role |
|------|------|
| `client/src/context/AuthContext.tsx` | Holds `user`, `loading`, `login`, `logout`, `refresh`. On mount, `refresh()` calls `GET /api/me` with token from localStorage; stores user or clears token. |
| `client/src/lib/api.ts` | Base `api<T>(path, options)` adds `Authorization: Bearer <token>` and parses JSON; throws on !res.ok. Exposes `authApi`, `intentApi`, `executeApi`, `studentsApi`, `classesApi`, `subscriptionApi`, `adminApi`, `notificationsApi`. All request paths are relative to `/api` (e.g. `/auth/login` → `/api/auth/login` via proxy). |

### 4.4 Voice flow (Dashboard)

| Component | Role |
|-----------|------|
| `VoicePanel` | Steps: idle (mic) → transcript (edit/confirm) → extracting → confirm (modal) or back to transcript → executing → done. Calls `intentApi.extract(transcript)` then shows `ConfirmationModal` or error. On Execute, sets step to executing and renders `ExecutionPanel`. |
| `ConfirmationModal` | Shows “Here’s what I understood” and Cancel / Modify / Execute. Uses `speak()` to read summary; on Execute calls parent’s execute handler. |
| `ExecutionPanel` | Runs step animation, calls `executeApi.execute({ ...extracted, transcript })`, then `speak("Your request has been successfully completed.")` and onDone; on error shows message and optional Upgrade modal. |
| `UpgradeModal` | Shown when execution fails with BASIC limit or reminder not allowed; “Maybe later” closes. |

### 4.5 Speech

| File | Role |
|------|------|
| `client/src/lib/speech.ts` | `speak(text, onEnd?)`, `cancelSpeech()`, `getSpeechRecognition()`, `startListening(onResult, onError?)` — Web Speech API (recognition) and SpeechSynthesis. Returns stop function from `startListening`. |

### 4.6 Layout and pages

| File | Role |
|------|------|
| `client/src/components/Layout.tsx` | Sidebar: ClassAssist AI, user name/role, nav links (by role), logout. Renders `<Outlet />` for child route. |
| `client/src/pages/Login.tsx` | Form: email, password; calls `login()` from AuthContext; navigates to `/dashboard` on success. |
| `client/src/pages/Dashboard.tsx` | Renders `VoicePanel`. |
| `client/src/pages/Students.tsx` | Lists students, form to add student (calls `studentsApi.create`). |
| `client/src/pages/Calendar.tsx` | Month view, fetches `classesApi.list({ from, to })`, color by status, click → details modal. |
| `client/src/pages/Notifications.tsx` | Lists `notificationsApi.list()`. |
| `client/src/pages/Admin.tsx` | Tabs: accounts/usage vs create; create account, create user; uses `adminApi`. |

### 4.7 Types

| File | Role |
|------|------|
| `client/src/types/api.ts` | `User`, `Role`, `Account`, `Student`, `Class`, `ClassStatus`, `ExtractedIntent`, `Notification`, etc. Used by components and api.ts. |

---

## 5. Data flow summary

### 5.1 Login

1. User submits email/password on `Login`.
2. `authApi.login()` → `POST /api/auth/login` → `auth.ts` validates, finds user, compares password, calls `createToken()`, returns `{ user, token }`.
3. Client stores token in localStorage, sets user in AuthContext, navigates to `/` → RoleRedirect → `/dashboard` or `/admin`.

### 5.2 Authenticated requests

1. Every API call from `api.ts` sends `Authorization: Bearer <token>`.
2. Protected routes run `authMiddleware`: verify JWT, load user (with account), set `req.user`.
3. Role-protected routes then run `requireRoles(...)`.

### 5.3 Voice command flow

1. User taps mic → `startListening()` → transcript appears (and can be edited).
2. User clicks Confirm → `intentApi.extract(transcript)` → `POST /api/intent/extract` → `getAIProvider().extractIntent(transcript)` → response with `intent` + fields or `intent: "unsupported"`.
3. If supported, `ConfirmationModal` shows; TTS speaks summary. User clicks Execute.
4. `ExecutionPanel` calls `executeApi.execute({ ...extracted, transcript })` → `POST /api/execute` → execute route → `executeCommand()` → classService method → `mapCommandResultToHttp()` → same status/body as before refactor.
5. On success, TTS says “Your request has been successfully completed.” and step goes to done.

---

## 6. API contract (for fixing issues)

- **POST /api/auth/login**  
  Body: `{ email, password }`.  
  Success: 200, `{ user, token }`.  
  Error: 401, `{ error }`.

- **POST /api/auth/register**  
  Body: `{ email, password, name, role, accountId? }`.  
  Success: 200, `{ user, token }`.  
  Errors: 400 (validation / email exists / account not found).

- **GET /api/me**  
  Auth: Bearer.  
  Success: 200, `{ id, email, name, role, accountId, account }`.

- **POST /api/intent/extract**  
  Auth: Bearer. Roles: TEACHER, MANAGER.  
  Body: `{ transcript }`.  
  Success: 200, `{ intent, studentName?, subject?, date?, time?, ... }` or `{ intent: "unsupported" }`.

- **POST /api/execute**  
  Auth: Bearer. Roles: TEACHER, MANAGER.  
  Body: `{ intent, studentName?, subject?, date?, time?, newDate?, newTime?, message?, transcript?, email?, phone? }`.  
  Success: 200, `{ success: true, class? | cancelled? | student? | remindersSent? }`.  
  Errors: 400 (validation / STUDENT_NAME_REQUIRED / MULTIPLE_CLASSES / Unsupported intent), 403 (No account / BASIC_LIMIT_REACHED / REMINDER_NOT_ALLOWED), 404 (Account not found / No matching class), 500 (Execution failed).

- **GET /api/students**, **POST /api/students**  
  Auth + TEACHER/MANAGER. List and create students for the account.

- **GET /api/classes**, **GET /api/classes/:id**  
  Auth + TEACHER/MANAGER. Optional query: `from`, `to` (ISO strings).

- **GET /api/subscription/limits**  
  Auth + TEACHER/MANAGER. Returns `{ canCreateClass, limit?, count?, tier }`.

- **GET /api/notifications**  
  Auth + TEACHER/MANAGER. Returns list of notifications.

- **POST /api/admin/accounts**, **POST /api/admin/users**, **GET /api/admin/accounts**, **GET /api/admin/usage**  
  Auth + ADMIN only.

---

## 7. Where to fix common issues

| Issue | Where to look |
|-------|----------------|
| Auth / 401 / token | `server/src/middleware/auth.ts` (JWT verify, user load), `client/src/context/AuthContext.tsx` (refresh, token storage), `client/src/lib/api.ts` (header). |
| Role / 403 | `requireRoles` in middleware; route mount (admin vs teacher routes); `client/src/App.tsx` (PrivateRoute roles), `client/src/components/Layout.tsx` (nav by role). |
| Intent extraction wrong or unsupported | `server/src/ai/OpenAIProvider.ts` (prompt, parse), `server/src/ai/index.ts` (AI_MODE, OPENAI_API_KEY), `server/src/routes/intent.ts`. |
| Execute fails (business rule) | `server/src/services/classService.ts` (per-intent logic), `server/src/services/subscription.ts` (limits), `server/src/orchestration/commandOrchestrator.ts` (dispatch, account load). |
| Execute HTTP shape/status wrong | `server/src/orchestration/commandOrchestrator.ts` → `mapCommandResultToHttp` (exhaustive error codes); `server/src/routes/execute.ts` (Zod, 403 no account, 500). |
| DB errors / missing data | `server/prisma/schema.prisma`, `server/src/lib/prisma.ts`, seed; ensure migrations/push and seed run. |
| Voice not working | `client/src/lib/speech.ts` (browser APIs), `client/src/components/VoicePanel.tsx` (steps, transcript, confirm), ExecutionPanel (execute call, errors). |
| Calendar / classes list wrong | `client/src/pages/Calendar.tsx` (date range, display), `server/src/routes/classes.ts` (filter by from/to, accountId). |
| Notifications not appearing | `server/src/services/notificationService.ts` (insert), `server/src/routes/notifications.ts` (list), `client/src/pages/Notifications.tsx`. |
| Admin create account/user | `server/src/routes/admin.ts`, `client/src/pages/Admin.tsx`. |

---

## 8. Environment and run

- **Server**: `server/.env` — `DATABASE_URL`, `PORT`, `JWT_SECRET`, `AI_MODE`, `OPENAI_API_KEY`.
- **Client**: Vite proxy in `client/vite.config.ts`: `/api` → `http://localhost:3001`.
- **Run**: From root, `npm run dev` (runs server + client). Or `npm run dev:server` and `npm run dev:client` separately.
- **DB**: `npm run db:generate`, `npm run db:push`, `npm run db:seed` (from root).

This architecture is the single source of truth for understanding and fixing the app.
