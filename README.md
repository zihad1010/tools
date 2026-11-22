# Student Tools (CG Calculator + PIN-protected Dashboard)

Cloudflare Worker + D1 database. Same theme as the ClassRoom PWA.

```
public/            website files (home, calculator, dashboard/)
  dashboard/       PROTECTED folder: only served after a correct PIN
src/index.js       Worker: sign up, login (PIN), logout, dashboard gate
wrangler.jsonc     Cloudflare settings
schema.sql         tables (the Worker also creates them automatically)
```

## Deploy (one time)

```bash
npx wrangler d1 create student-tools-db        # copy the database_id into wrangler.jsonc
npx wrangler secret put SESSION_SECRET         # type a long random text; never change it later
npx wrangler deploy
```

`SESSION_SECRET` signs sessions and is mixed into every PIN hash. If you change it, all PINs stop working.

## How it works

- Tap **My Dashboard** → PIN is asked every time the app/page opens. No account on this device → Sign in or Create account.
- Sign up asks: Student ID (twice), Nickname, 4-digit PIN (twice).
- PINs are stored only as salted PBKDF2 hashes (mixed with the secret). 5 wrong PINs lock that account for 15 minutes; many failures from one IP are also blocked.
- Everything inside `public/dashboard/` is served only with a valid session (2 hours max, and cleared every time the home page opens).

## Class list (optional, recommended)

Anyone can sign up with any Student ID, so a student could register someone else's ID first. To stop that, add the real IDs; once the table has rows, only those IDs can sign up:

```bash
npx wrangler d1 execute student-tools-db --remote --command "INSERT INTO roster (student_id) VALUES ('26549012094'),('26549012095')"
```

## Reset a forgotten PIN

Delete the account, then the student signs up again:

```bash
npx wrangler d1 execute student-tools-db --remote --command "DELETE FROM students WHERE student_id='26549012094'"
```

## Connecting your own dashboard

Put the dashboard files in `public/dashboard/` (replace the placeholder `index.html`) and they are protected automatically. If you set `dashboardUrl` in `public/config.js` to an outside website instead, the PIN is only checked on this site; the other site must do its own check.
