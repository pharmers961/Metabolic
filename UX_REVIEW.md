# Metabolic Method Tracker — UI/UX Review

> **Status: all 48 recommendations implemented** in the v2 rebuild on this branch (`index.html`, `app.js`, `program.js`, `sw.js`). The two caveats are platform limits, not omissions: true background notifications while the PWA is fully suspended aren't possible without a push server (the timer instead survives suspension via end-timestamps, re-fires on return, and notifies whenever the browser allows), and Google Calendar/Drive OAuth requires a personal Google Client ID (3-minute one-time setup, documented in the README) — the no-auth `.ics`/template-link tier works with zero setup.

48 recommendations, based on a full read of `app.js`/`index.html`, screenshots of every screen at phone size, and the Workout Template Guide V2 PDF the program is encoded from.

**Priority key:** **P0** = do first (fixes a daily pain or a data-loss risk) · **P1** = next · **P2** = later polish.

**The short version:** the core logging loop and the rest-timer overlay are genuinely good. The three structural problems are: (1) the app has no memory of *where you are in the program* — every session starts with phase pills → week pills → day cards; (2) the in-session screen is one enormous scroll with no focus or collapsing; (3) everything lives in `localStorage` on one phone, one browser-data-clear away from losing six months of training history.

---

## Part 1 — The five features you asked for

### 1. 1RM saver + built-in strength calculator — P0
The guide explicitly says to use the external "Strength Calculator" for phases 3–5; the app even has a note telling you to go use it. Bring it in-app:
- Add a **Lifts** section storing a 1RM per main lift (Squat, Bench, Deadlift, OHP, + custom), with date and history of past PRs.
- **Auto-estimate from logged sets**: after you check off a heavy set, compute estimated 1RM (Epley: `w × (1 + r/30)`) and prompt "Est. 1RM 225 lb — new PR, save?" No separate data entry needed.
- **Use it to prescribe loads**: during the strength wave (W1 3×8 → W2 4×6 → W3 5×5 → W4 4×4), print the suggested working weight right in the exercise meta line (e.g. `3×8 @ ~72% → 185 lb`), rounded to the nearest 2.5/5 lb plate.
- Show an e1RM trend sparkline per lift in History/Stats.

### 2. Rest countdown upgrades — P0
The timer exists and looks great, but:
- **It dies when the screen locks.** `setInterval` freezes when the PWA is backgrounded. Compute remaining time from a stored *end timestamp* instead of decrementing a counter, so it's correct on resume — and re-request the wake lock on `visibilitychange` (it's silently released on every screen lock today).
- **Fire a notification + vibration at zero** (Notification API) so the phone in your pocket tells you the rest is over.
- **Don't block the whole screen.** Collapse the overlay into a sticky mini-pill after a couple of seconds so you can review the next exercise, log the other half of a superset, or fix a typo during the 3-minute rest. Tap to re-expand.
- Add **pause** and **−15s** next to +30s; per-exercise custom rest override; a Settings toggle for auto-start.
- **Superset-aware next-up**: after a set of exercise A, "then back to" should name exercise B, and the 10-second superset rests deserve a short chime rather than the full overlay ceremony.

### 3. Calendar view — P0
- Month grid in History: gold-filled dot for each day trained; tap a day to open that session; show current streak and weekly volume beneath.
- **Program position awareness**: the guide is a 6-month calendar. Show "Month 3 · Week 2 · next: Day 4 — Deadlifts/Back" so the calendar isn't just a diary but a map of the plan.
- Optional plan mode: assign program days to weekdays (Day 1 = Monday…), so future days show as scheduled, past days as done/missed.

### 4. Google Calendar sync — P1
Two tiers, cheapest first:
- **Tier 1 (no auth, works today)**: generate an `.ics` file or prefilled `calendar.google.com/render?action=TEMPLATE` links for your scheduled training week — one tap adds "MM Day 1 — Squat/Legs" as a recurring event with a 1-hour reminder.
- **Tier 2 (full sync)**: Google Identity Services OAuth + Calendar API. Push scheduled workouts as events; after finishing a session, update the event with actual duration and volume. Share the same Google sign-in with backup (below) so it's one "Connect Google" button, not two.

### 5. Backup off the phone — P0 (the most important item in this review)
`localStorage` is single-device and evictable (Safari purges it after 7 days of disuse; "clear browsing data" erases it; a lost phone erases it).
- **Tier 1 now**: auto-reminder when the last export is >7 days old; use the Web Share API so "Export" can go straight to Google Drive/Files instead of a downloads folder.
- **Tier 2**: sync to Google Drive `appDataFolder` — push after every finished session, pull-and-merge on app load (merge by session date-ID, last-write-wins). This gives multi-device access with no server to run.
- Migrate storage to IndexedDB and call `navigator.storage.persist()` to ask the browser not to evict.

---

## Part 2 — Organization & navigation (the "unorganized" feeling)

**6. Add a real "Today" home screen — P0.** The app should open with one big button: "Continue: Phase 3 · Week 2 · Day 4 — Deadlifts/Back", plus streak and last-workout summary. Today you re-answer three questions (phase? week? day?) before every single workout.

**7. Auto-advance program position — P0.** After finishing Day 2, suggest Day 3 next time; roll week after Day 5; roll phase after Week 4. Note: switching phases currently resets week to 1 silently.

**8. A workout in progress should follow you — P1.** The Train tab silently becomes the session screen. Instead, show a persistent "Workout in progress · 24 min · Resume" banner on every tab, and keep Train's day list reachable.

**9. Break up the Program tab — P1.** It's a wall of text (six `<details>` dumps, hundreds of lines). Make it Phase → Day drill-down pages, and add search ("where does Face Pulls appear?").

**10. Rationalize the tabs — P1.** "Fitbit" is a brand, not a user goal. Merge Fitbit + History into **Stats**; nav becomes Today / Train / Program / Stats / Settings. Fitbit setup is currently split across two tabs (explanation on Fitbit, Client-ID field on Settings) — put it in one place.

**11. Settings order & data card — P2.** Lead with the things you'll touch (unit), collapse Fitbit setup into a `<details>`, give the Data card a "last backup: 3 days ago" timestamp.

**12. Consistent week UI — P2.** Week pills appear only for phases 1 and 3–5; phases 2 and 6 show nothing. Always show program position; if weeks don't change targets, say so.

**13. Explain the phases — P1.** "Last Set Best Set", "Top Set Drop Set", "Max RPE" appear with zero explanation. Add a per-phase info sheet summarizing the method (source material is all in the PDF).

**14. Make Day 3 look like what it is — P2.** Active Recovery renders identically to a lifting day ("2 movements · 1 warm-ups"). Style it differently and let it be checked off in one tap.

**15. Actionable empty states — P2.** "No workouts yet. Start one from the Train tab" should be a button that goes there.

---

## Part 3 — In-workout logging

**16. Prefill targets and last weights — P0.** Put the target reps in the reps input as placeholder (it's "—" today even though the target is right above), and prefill weight from the last session of that exercise instead of only showing a "Last:" caption to retype.

**17. Weight steppers — P0.** Add +/− buttons with plate-math increments (5 lb / 2.5 kg, small-increment mode for dumbbell work). Typing on a number pad mid-set is the single most repeated interaction in the app.

**18. Fix the "+ Add set" scroll jump — P0 (bug).** It calls a full re-render and throws you back to the top of a 10-screen-tall page. Preserve scroll position (or append the row in place).

**19. Per-set targets for pyramid schemes — P1.** "15/12/10/12/15" and "12/10/8" render as a single meta string; each set row should show its own target.

**20. One-tap logging flow — P1.** Auto-advance focus weight → reps → check; if reps are prefilled from target, a set becomes literally one tap.

**21. Add RPE and set notes — P1.** Phase 5 is *named* "Low Volume Max RPE" and there is no way to record RPE. A small optional RPE field on strength sets, and a note per exercise ("felt heavy", "left knee").

**22. Exercise substitution memory — P1.** The guide says to mix and match by equipment/preference, and slots are generic ("Squat Variation — AML Progression"). Let the user pick/rename the actual movement (e.g. "High-Bar Back Squat") and remember it — otherwise history mixes different lifts under one name, which also poisons 1RM tracking.

**23. Honest superset flow — P1.** Supersets render as consecutive straight-set lists. Present rounds as alternations (A1 → B1 → rest → A2 → B2) with round-level progress.

**24. Collapse what's done — P0.** Completed exercises should fold to a one-line summary (name + best set + ✓), warm-ups collapse after checking. This alone cuts the session scroll by ~70%.

**25. Focus mode — P1.** Highlight the first incomplete exercise as "current", dim the rest, add a per-exercise progress ring. The sticky global bar is nice but doesn't tell you *where* you are.

**26. Finish with a summary — P1.** "Finish workout" instantly dumps you to the start screen. Show a summary sheet first: duration, sets, volume, any PRs (tie into #1), then save. A small PR celebration goes a long way for motivation.

**27. Protect against mis-taps; allow pausing — P1.** "Discard" sits in the header one native-confirm away from deleting a session. Move it behind an overflow menu. Add explicit "finish later" (state already survives reload — surface it), and let duration be edited, since a session resumed the next day logs a 900-minute workout.

**28. Sound & haptics options — P2.** Haptic tick on set-check; mute toggle for the timer alarm; respect the phone's silent mode.

---

## Part 4 — History & progress

**29. Per-exercise history — P0.** Tap any exercise name → all past sets + weight/volume/e1RM chart. This is the payoff of all that logging, and right now the data is trapped inside per-session accordions.

**30. Trends dashboard — P1.** Weekly volume chart, sessions per week vs. plan, phase completion %, streak. The Fitbit recovery data can sit beside it (see #10).

**31. Richer history list — P2.** Group sessions by week with a weekly volume subtotal; filter by day type (all Squat days together).

**32. Edit past sessions — P1.** A typo'd weight currently means deleting the entire workout. Allow editing sets after the fact.

**33. Replace native confirm()/alert() — P2.** Styled in-app dialogs, and for deletes prefer an undo toast over a permanent confirm.

**34. Validate durations — P2.** Cap/flag absurd durations (see #27) so history stats stay meaningful.

---

## Part 5 — Visual design & accessibility

**35. Type size and contrast for gym distance — P1.** The 10–11px uppercase micro-labels (column heads, day numbers, nav) are hard to read with the phone on the floor beside a bench. Bump micro-type to ≥12px and lighten use of `--muted` (#8F8A79 on card surfaces is ~4:1 — below WCAG AA for small text). The aesthetic survives at 12–13px.

**36. Touch targets ≥44px — P2.** The set-check button (52×42) is good; keep inputs and nav at the same standard, and add `font-variant-numeric: tabular-nums` so timer digits don't jitter.

**37. Screen-reader basics — P1.** `aria-current` on the active tab; `aria-pressed`/labels on set-check buttons ("Mark set 2 of Squat done"); the rest overlay has `role=dialog` but no focus trap, and the countdown needs an `aria-live` region (polite, announce at 30s/10s/0).

**38. Don't rely on color alone — P2.** Mostly fine (✓ glyphs everywhere) — keep it that way as new states are added; ensure the strikethrough on done warm-ups keeps 3:1 contrast.

**39. Reduced motion — done.** The media query exists; keep the timer ring exempt but simplify it (fade instead of sweep) when reduced motion is on.

**40. Tablet/landscape layout — P2.** On anything wider than a phone, let the session render two columns (exercise list + current exercise), instead of a 560px ribbon.

**41. Icon semantics — P2.** The calendar glyph currently means "Program" and a clock means "History". When the real Calendar view (#3) lands, reassign: calendar icon → calendar, book → program.

**42. PWA chrome polish — P2.** Add iOS status-bar meta and a maskable icon variant so the installed app looks native on both platforms.

---

## Part 6 — Data & reliability

**43. Debounce writes; move to IndexedDB — P1.** `save()` re-serializes the *entire* sessions array on every keystroke of every input. Fine today, sluggish after six months of history. Debounce, and store sessions individually in IndexedDB.

**44. Complete, versioned export — P0.** Export currently contains only `{sessions}` — no settings, no unit, no (future) 1RMs, no in-progress session. Import silently *replaces* instead of merging. Export everything with a schema version; import should merge by session ID and report what changed.

**45. Service-worker update flow — P2.** Cache-first with a fixed cache name means users can be stuck on an old version. Version the cache and show a "New version available — refresh" toast.

**46. Wake lock resilience — P0.** Requested once at session start and never re-acquired; after the first screen lock it's gone for the rest of the workout. Re-request on `visibilitychange`. (Same fix pairs with the timer-timestamp fix, #2.)

**47. Fitbit error recovery — P2.** Token-refresh failure should sign out cleanly with a "Reconnect" button, not a dead error string; add a retry button to the failed-load state.

**48. Keep escaping consistently — P2.** `esc()` is used well; keep it mandatory for any future user-entered names/notes (#21, #22) since they'll be re-rendered as HTML.

---

## Suggested order of attack

1. **#5 backup** + **#44 export** — protect the data before anything else.
2. **#2/#46 timer + wake lock fixes** — the feature you rely on mid-set must survive a locked screen.
3. **#6/#7 Today screen + auto-advance** — kills most of the "unorganized" feeling in one move.
4. **#1 1RM saver + load suggestions** — replaces the external spreadsheet for phases 3–5.
5. **#16/#17/#18/#24 logging quick wins** — prefill, steppers, scroll fix, collapse-done.
6. **#3 calendar view**, then **#4 Google Calendar** (reuse the Google auth for Drive backup).
7. Everything else by tag: P1s, then P2s.
