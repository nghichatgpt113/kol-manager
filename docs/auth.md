# Authentication Architecture & Protected Routes Foundation

## Overview

The **KOL Manager** application uses **Supabase Auth** with `@supabase/ssr` to implement secure, cookie-based authentication across Next.js App Router (version 16.3+).

All private application routes are protected on the server side using an authenticated route group layout, preventing unauthenticated access while maintaining session persistence across navigation and page refreshes.

---

## 1. Authentication Architecture

### Utilities (`utils/supabase/`)

- **`utils/supabase/client.ts`**:
  - Initializes `createBrowserClient` from `@supabase/ssr`.
  - Used in Client Components (such as `login-form.tsx`) for user interactions like `signInWithPassword`.
  - Automatically reads and syncs auth tokens with browser cookies.

- **`utils/supabase/server.ts`**:
  - Initializes `createServerClient` from `@supabase/ssr`.
  - Uses `next/headers` `cookies()` to read request cookies and write updated cookies during Server Actions or Route Handlers.
  - Safe for Server Components (reads cookies; server-side writes in render phases are caught safely).

- **`utils/supabase/middleware.ts`**:
  - Initializes `createServerClient` in the Next.js edge/middleware runtime.
  - Manages request and response cookie synchronization (`getAll` and `setAll`).
  - Calls `supabase.auth.getUser()` to refresh expired access tokens transparently before passing the request to Server Components.

---

## 2. Protected Route Structure (`app/(protected)/`)

To scale cleanly for future private routes (`/dashboard`, `/kols`, `/bookings`, `/workflow`, `/videos`, `/products`, `/templates`, `/tasks`, `/settings`), the project utilizes Next.js **Route Groups**:

```
app/
├── (protected)/
│   ├── layout.tsx         # Shared Server Component protecting all nested routes
│   └── dashboard/
│       └── page.tsx       # /dashboard
├── login/
│   ├── page.tsx           # Server Component: redirects authenticated users to /dashboard
│   └── login-form.tsx     # Client Component: accessible form UI
├── layout.tsx             # Root layout with HTML/Body & global styles
└── page.tsx               # Root landing page
```

### Protection Mechanism: `app/(protected)/layout.tsx`
- **Execution**: Runs on the server for any route placed inside `(protected)/`.
- **Validation**:
  ```typescript
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }
  ```
- **Benefit**: Does not alter the URL pathname (`/dashboard` remains `/dashboard`). Future routes (`/kols`, `/bookings`, etc.) placed inside `app/(protected)/` automatically inherit this server-side protection with zero boilerplate.

---

## 3. Login Flow & Authenticated Redirect

### Login Page Architecture
- **Server Component (`app/login/page.tsx`)**:
  - Checks if the visitor already has an active session via `supabase.auth.getUser()`.
  - If authenticated: Immediately issues an HTTP 307 redirect to `/dashboard`.
  - If unauthenticated: Renders the Client Component form (`login-form.tsx`).

- **Client Component Form (`app/login/login-form.tsx`)**:
  - Validates email and password format before sending network requests.
  - Calls `supabase.auth.signInWithPassword({ email, password })`.
  - On success: Navigates to `/dashboard` via `router.push('/dashboard')` and refreshes the router.
  - On failure: Displays friendly, non-sensitive error messages without exposing technical stack traces.

---

## 4. Logout Flow

- Implemented via a Next.js Server Action (`handleLogout`) on the server:
  ```typescript
  async function handleLogout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }
  ```
- Calling `supabase.auth.signOut()` on the server clears the auth session cookies directly on the response headers.
- The user is then redirected to `/login`. Subsequent requests to protected routes will fail the server-side auth check and redirect to `/login`.

---

## 5. Session Persistence & Middleware Refresh

- **Cookie Management**: Session tokens are stored in HTTP cookies (`sb-<project-ref>-auth-token`).
- **Middleware Refresh**:
  - Root `middleware.ts` intercepts all application requests except static assets and images.
  - Calls `createClient(request)` in `utils/supabase/middleware.ts` which refreshes the auth token via `await supabase.auth.getUser()`.
  - Refreshed tokens are returned in the response headers to the client, preventing sudden logouts when an access token expires.

---

## 6. Environment Variables

Configured in `.env.local` (kept out of Git tracking):

| Variable | Description | Exposure |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Public / Client & Server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Publishable (Anon) Key | Public / Client & Server |

> [!NOTE]
> No `service_role` key or database connection passwords should ever be placed in public environment variables or used in client code.

---

## 7. Security Considerations

1. **Server-Side Authorization**: Protection does not rely on `localStorage`, `useEffect`, or client-side flags. `supabase.auth.getUser()` verifies JWT cryptographic validity directly on the server.
2. **Credential Sanitization**: Passwords are never logged, stored in application state, or included in URLs.
3. **No Secret Keys Exposed**: Only public publishable keys (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) are utilized, relying on Supabase Row Level Security (RLS) for data-layer protection.
4. **Hydration and Extension Safety**: Handled against browser extensions (e.g. Bitdefender Anti-tracker) injecting DOM attributes via `suppressHydrationWarning` and attribute cleanup observers.
