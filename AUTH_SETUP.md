# iChess account system — Cloudflare Pages + D1

## Included
- Email/password registration and login (PBKDF2-SHA-256 password hashes; passwords are never stored in plaintext).
- Google OAuth sign-in for new Google identities.
- Random, server-side sessions stored as SHA-256 hashes in D1; `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
- User-scoped settings, saved PGN games, stats, progress and learned-position entries.
- Existing anonymous `/api/sync` remains available for guests. Authenticated sessions stop using it for background sync.

## 1. Back up the existing D1 database first

Do not delete the old `sync` table. It contains anonymous users' data and this release does not automatically claim those records for new accounts.

## 2. Apply the schema

- **New D1 database:** execute the complete `schema.sql`.
- **Existing D1 database:** execute `schema-auth.sql` to add account tables while preserving `sync`.
- Keep the Pages D1 binding name exactly `DB`.

## 3. Configure Google OAuth

In Google Cloud Console, create an OAuth client of type **Web application**. Add the production callback URI:

`https://YOUR-DOMAIN.pages.dev/api/auth/google/callback`

Add the preview callback URI too if you plan to test OAuth on a preview deployment. In Cloudflare Pages → Settings → Variables and Secrets, add:

- `GOOGLE_CLIENT_ID` (variable)
- `GOOGLE_CLIENT_SECRET` (secret)

Do not put the client secret in `index.html`, Git, or any public file. The callback uses OAuth state cookies and Google's token/userinfo endpoints. Existing password accounts with the same email are deliberately not silently linked; use the password account until an explicit account-link flow is added.

## 4. Deploy

Push the files to the GitHub branch connected to Pages, confirm the `DB` binding, and redeploy. No build command is needed for this static HTML + Pages Functions project.

## 5. Test on the deployed HTTPS domain

1. Create a test account with a unique email and a password of at least 10 characters.
2. Sign out, then sign back in.
3. Change a setting and save a game; click **مزامنة بيانات الحساب الآن**.
4. Open the same account in a second browser/device and confirm settings and saved games arrive.
5. Test Google sign-in with a Google account not already used by a password account.
6. Confirm one account cannot access another account's data by changing IDs in client requests; server queries always scope by the session user.

## Important production hardening still required

This is an integration baseline, not a security audit. Before public promotion, add email verification and password reset, durable IP/account-based rate limiting for registration/login, a documented account deletion/export flow, and automated end-to-end tests. Monitor D1 row/storage limits; learned-position sync is capped at 4,000 entries per account and saved games at 200. Existing anonymous `sync` records are preserved but not automatically migrated because the old secret-key model has no verified email identity.
