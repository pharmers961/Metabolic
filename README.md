# Metabolic Method Tracker — Setup

A personal PWA workout tracker built from your Metabolic Method Workout Template Guide (5-Day Routine, Phases 1–6), with set/rep/weight logging, automatic rest timers, workout history with volume totals, and Fitbit sync (steps, calories, resting HR, HR zones).

## 1. Host it (5 minutes, free — GitHub Pages)

PWAs and Fitbit OAuth both require HTTPS, so the files need to live at a real URL:

1. Create a new GitHub repo (e.g. `mm-tracker`), can be private-name/public-repo.
2. Upload all files in this folder: `index.html`, `app.js`, `sw.js`, `manifest.json`, `icon-192.png`, `icon-512.png`.
3. Repo → Settings → Pages → Source: "Deploy from a branch" → `main` / root → Save.
4. Your app is live at `https://<username>.github.io/mm-tracker/`

(Netlify Drop also works: drag the folder onto app.netlify.com/drop.)

## 2. Install on your Android phone

Open the URL in Chrome → menu (⋮) → **Add to Home screen** → Install. It launches full-screen like a native app and works offline after the first load.

## 3. Connect Fitbit

1. Go to **dev.fitbit.com** → Manage → Register an App (log in with your normal Fitbit account).
2. Fill in:
   - Application type: **Personal**
   - OAuth 2.0 Application Type: **Client**
   - Redirect URL: your exact app URL, e.g. `https://<username>.github.io/mm-tracker/index.html` — the app shows you the exact string to use on its Fitbit tab.
3. Copy the **OAuth 2.0 Client ID** into the app: Settings tab → Fitbit Client ID.
4. Fitbit tab → **Connect Fitbit** → approve → done. Tokens refresh automatically.

## Notes

- All workout data lives on your phone (localStorage). Use Settings → Export JSON for backups; nothing is sent anywhere except Fitbit's API when you refresh stats.
- Phase 1 auto-adjusts targets by week (per the guide); Phases 3–5 have a week selector for the strength wave (3×8 → 4×6 → 5×5 → 4×4).
- Day 3 of each phase is shown as Active Recovery/Mobility per the course calendar (the PDF doesn't list a Day 3 lifting session).
