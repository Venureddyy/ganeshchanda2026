# Ganesh Chaturthi Chanda — Fund Tracker

A single live page showing total funds collected, the donation list, and
running expenses — anyone with the link sees the same numbers update in
real time.

Because GitHub Pages only serves static files, the shared data lives in
a free **Firebase Firestore** database. Setup takes about 10 minutes and
costs nothing at this scale.

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com → **Add project** → give it
   any name (e.g. `ganesh-chanda-2026`) → finish the wizard (you can skip
   Google Analytics).
2. In the left sidebar: **Build → Firestore Database → Create database**.
   Choose **Start in production mode**, pick a location close to you.
3. Left sidebar: **Project settings** (gear icon) → scroll to **Your
   apps** → click the `</>` (web) icon → register the app (nickname
   doesn't matter, skip Firebase Hosting).
4. Copy the `firebaseConfig` object it shows you.

## 2. Configure the site

1. Open `firebase-config.js` and paste your copied values in.
2. Open `app.js` and change `ADMIN_PASSCODE` at the top to your own
   passcode (this is what unlocks the "Add donation" form).
3. Open `firestore.rules` and change `"ganpati2026"` to the **same**
   passcode you set in step 2 — this is what actually enforces
   admin-only donation entries on the server, not just in the browser.

## 3. Apply the security rules

In the Firebase console: **Firestore Database → Rules** tab → paste in
the contents of `firestore.rules` → **Publish**.

This gives you:
- **Donations** — anyone can read; only writes carrying the correct
  passcode are accepted. Deleting a donation isn't possible from the
  browser (a password check can't be trusted for deletes) — if you need
  to remove a wrong entry, do it from **Firestore Database → Data** tab
  in the console directly.
- **Expenses** — open to read and add for anyone with the link, exactly
  as you asked. Admins (unlocked in the browser) also get a ✕ to remove
  a wrong expense entry.

⚠️ **Honest caveat:** the passcode is sent from the browser and lives in
plain text in your files and rules. It's enough to stop casual/accidental
edits from the public, but a technically determined person could find
it. For a temple committee chanda this is normally an acceptable
trade-off against the complexity of full user accounts — just don't
reuse this passcode anywhere sensitive.

## 4. Publish on GitHub Pages

1. Create a new GitHub repository and push all these files to it.
2. Repo → **Settings → Pages** → under "Build and deployment", set
   **Source: Deploy from a branch**, branch: `main`, folder: `/ (root)`.
3. Wait a minute, then your site is live at
   `https://<your-username>.github.io/<repo-name>/`.

Share that link — the fund and expense list update live for everyone
who opens it, no refresh needed.

## Files

- `index.html` — page structure
- `style.css` — festive theme
- `app.js` — logic (edit `ADMIN_PASSCODE` here)
- `firebase-config.js` — your Firebase project keys (edit here)
- `firestore.rules` — server-side access rules (paste into Firebase console)
