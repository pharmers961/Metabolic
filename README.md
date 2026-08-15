# Metabolic Method Tracker — Setup

A personal PWA workout tracker built from the Metabolic Method Workout Template Guide (5-Day Routine, Phases 1–6).

**v2** — organized around a Today screen that knows where you are in the 6-month program, with:
set/rep/weight logging (prefilled from last time, plate-math ± buttons), a rest timer that survives a locked screen (mini-pill mode, pause/−15s/+30s, end-of-rest notifications), automatic 1RM detection with suggested wave loads for the strength phases, RPE + notes, per-exercise history charts, a training calendar with streaks, weekly-volume trends, session editing with undo-delete, Google Calendar sync, Google Drive cloud backup, and Fitbit recovery stats.

Your existing data migrates automatically on first load (and now lives in IndexedDB, with localStorage as a fallback mirror).

## 1. Host it (5 minutes, free — GitHub Pages)

PWAs and OAuth (Fitbit/Google) require HTTPS, so the files need to live at a real URL:

1. Create a new GitHub repo (e.g. `mm-tracker`).
2. Upload all files in this folder: `index.html`, `app.js`, `program.js`, `sw.js`, `manifest.json`, `icon-192.png`, `icon-512.png`.
3. Repo → Settings → Pages → Source: "Deploy from a branch" → `main` / root → Save.
4. Your app is live at `https://<username>.github.io/mm-tracker/`

(Netlify Drop also works: drag the folder onto app.netlify.com/drop.)

> Shipping an update later? Bump the `CACHE` version string at the top of `sw.js` — installed phones then show a "new version ready — Refresh" toast.

## 2. Install on your phone

Open the URL in Chrome → menu (⋮) → **Add to Home screen** → Install. It launches full-screen and works offline after the first load.

## 3. Plan your weeks

On first run the app asks which days you can usually train — that becomes your **usual pattern** (editable in Settings). Each real week is then planned on actual dates:

- **Today → "Plan week"** puts this week's workouts on concrete dates (prefilled from your pattern).
- **Miss a day?** Today shows a "Missed" card — one tap reschedules it to another date and the calendar (and Google Calendar, if connected) adjusts. Or skip it; the streak forgives one light week.
- The **commitment ring** on Today tracks workouts done vs. planned; the week streak counts weeks where you hit your own plan, and warns when it's at risk.
- New PRs get a full-screen celebration and land on the **trophy wall** (Stats → Lifts). Finish summaries compare you to the last time you did that day, and workout/monthly **share cards** can be sent anywhere.

- **Add to calendar (no sign-in):** Settings → "Add to calendar…" gives one-tap Google Calendar links per training day, or a `.ics` file that imports into Google/Apple/Outlook as weekly recurring events.

## 4. Connect Google (cloud backup + calendar sync) — optional

One connection powers two things: your log auto-backs-up to Google Drive after every workout (hidden app-data folder, restorable on any device), and your weekly schedule can sync straight into Google Calendar (plus "✓ done" events after each workout if you enable it).

1. console.cloud.google.com → create a project.
2. APIs & Services → enable **Google Drive API** and **Google Calendar API**.
3. OAuth consent screen → External → add your own Gmail as a test user.
4. Credentials → Create credentials → **OAuth Client ID** → type **Web application** → add your app's origin (e.g. `https://<username>.github.io`) under *Authorized JavaScript origins*.
5. Copy the Client ID into the app: Settings → Google → connect.

No Google? Settings → **Export / share** saves a JSON backup anywhere (Drive, Files, email) via the share sheet; Import merges backups without overwriting.

## 5. Connect Fitbit — optional

1. dev.fitbit.com → Manage → Register an App (type: **Personal**, OAuth 2.0 Application Type: **Client**).
2. Redirect URL: your exact app URL — Settings → Fitbit setup shows the exact string.
3. Paste the Client ID in Settings → Fitbit, then connect from **Stats → Recovery**.

## Using the 1RM features

- Log a heavy set on a main lift (squat / bench / deadlift / overhead press variations) and the app estimates your 1RM (Epley) and offers to save it as a PR.
- Or enter one directly: Stats → **Lifts** → Add.
- During the strength phases (3–5), the wave (3×8 → 4×6 → 5×5 → 4×4) then shows a suggested working weight on the lift itself ("try 190 lb"), rounded to real plates — replacing the course's external strength calculator.

## Notes

- Tap any exercise name (during a workout, or in history) to rename the generic slot to the movement you actually do, set a custom rest, and see your history chart for it.
- Phase 1 auto-adjusts targets by week; phases 3–5 follow the strength wave; phase 6 pyramids show per-set targets.
- Day 3 of each phase is Active Recovery/Mobility per the course calendar.
- The Program tab has per-phase explainers and exercise search; the review that drove this redesign is in `UX_REVIEW.md`.
