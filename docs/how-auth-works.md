# How Authentication Works

This app has two layers of auth: **application auth** (protecting the UI behind a login) 

---

## Application Auth

### Login Flow

1. User visits any page → Next.js middleware checks for a valid JWT in cookies → no token means redirect to `/login`
2. User submits username and password on the login page (`src/app/login/page.tsx`)
3. Client sends `POST /api/auth` with `{ username, password }`
4. Server (`src/app/api/auth/route.ts`) compares credentials against `ADMIN_USERNAME` and `ADMIN_PASSWORD` env vars
5. On match, server signs a JWT with payload `{ role: "admin" }` using the `jsonwebtoken` library, expiring in 1 year
6. Client receives the token and stores it in a cookie: `token=<jwt>; path=/; max-age=31536000`
7. Client redirects to `/`

### Route Protection (Middleware)

`src/middleware.ts` intercepts every request using the Next.js middleware matcher:

```
matcher: ["/((?!login|api/auth|public|_next).*)"]
```

**Unprotected routes:** `/login`, `/api/auth`, `/public/*`, `/_next/*`

**Everything else** requires a valid JWT. The middleware:
1. Reads the `token` cookie
2. Verifies the JWT signature using the `jose` library with `JWT_SECRET`
3. Valid → request proceeds; Invalid/missing → redirect to `/login`

> Note: JWT is **signed** with `jsonwebtoken` (Node.js, used server-side in the API route) but **verified** with `jose` (Edge-compatible, used in middleware). Both use the same `JWT_SECRET`.

### Sign Out

The sign-out button in `src/app/page.tsx` does:
1. Shows a confirmation dialog
2. Clears the cookie: `document.cookie = 'token=; path=/; max-age=0'`
3. Redirects to `/login`

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `ADMIN_USERNAME` | Login username |
| `ADMIN_PASSWORD` | Login password |
| `JWT_SECRET` | Secret for signing/verifying JWTs |

---

## Key Files

| File | Role |
|---|---|
| `src/middleware.ts` | JWT verification, route protection |
| `src/app/api/auth/route.ts` | Login endpoint, JWT signing |
| `src/app/login/page.tsx` | Login UI |
| `src/app/page.tsx` | Sign-out button |
