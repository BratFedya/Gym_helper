# Gym Helper

Personal iOS exercise tracker. No backend, no dependencies, no build step.

## Stack

- Vanilla HTML/CSS/JS — single-page app with hash-based routing, split into five classic-script layers (see Files)
- `localStorage` for all persistence (keys: `gym_exercises`, `gym_workouts`, `gym_lang`)
- Wrapped in a native iOS app via Xcode + `WKWebView` (`ContentView.swift`)

## Files

| File | Role |
|------|------|
| `index.html` | Shell — PWA meta tags, loads CSS and the five JS files |
| `style.css` | Dark theme (`#0F0F0F` bg, `#FF6B00` accent), mobile-first, safe-area aware |
| `i18n.js` | Localization: `LANG_KEY`, `LANGUAGES`, `TRANSLATIONS`, `getLang`/`setLang`/`plural`/`t`/`countLabel` |
| `store.js` | Data layer & domain logic (no DOM): localStorage keys, `CATEGORIES`/`MUSCLE_GROUPS`, exercise/workout CRUD, `getPrevWeight`, backup (`exportData`/`parseBackup`/`importData`/`window.__importFromNative`), `generateExercises` |
| `ui.js` | Shared UI primitives & formatters: `escHtml`, dates, `GROUP_ICONS`, `categoryLabel`, icon/pill builders, `buildWeightChart`, tab bar, `showConfirm`, `showSavePopup` |
| `views.js` | All `render*` screen functions |
| `app.js` | Router (`getRoute`/`navigate`) + `render()` dispatcher + entry listeners |
| `manifest.json` | PWA manifest (used when served over HTTPS, not needed for Xcode) |
| `ContentView.swift` | Xcode WKWebView wrapper — copy into Xcode project to build native iOS app |

**JS module structure:** The five JS files are **classic `<script>` tags** (not ES modules — WKWebView blocks module fetch on `file://` origins), sharing one global scope. `index.html` loads them in dependency order: **`i18n.js` → `store.js` → `ui.js` → `views.js` → `app.js`**. There are no top-level cross-file calls (only definitions, the two `window.addEventListener(..., render)` at the end of `app.js`, and the `window.__importFromNative` assignment in `store.js`), so everything resolves once all files are loaded and `DOMContentLoaded` fires. When adding code, put it in the file matching its layer and keep the load order intact.

## Routing (`app.js`)

Hash-based. `window.hashchange` → `render()` → dispatches to a view function.

| Hash | View function |
|------|---------------|
| `#list` | `renderList()` — exercise list with tab bar |
| `#add` | `renderAdd()` — new exercise form |
| `#settings` | `renderSettings()` — export/import backup (JSON) |
| `#exercise/:id` | `renderExercise(id)` — detail + edit button + delete + weight history chart |
| `#exercise/:id/edit` | `renderEditExercise(id)` — edit name, categories, description |
| `#workouts` | `renderWorkouts()` — workout history list with tab bar |
| `#workout/new` | `renderWorkoutNew()` — date picker + generate option |
| `#workout/generate` | `renderWorkoutGenerate()` — group picker, preview, start |
| `#workout/:id` | `renderWorkoutDetail(id)` — building mode (add/remove) or summary mode if finished |
| `#workout/:id/active` | `renderWorkoutActive(id)` — live workout: mark done, enter weights |
| `#workout/:id/add` | `renderWorkoutAddExercise(workoutId)` — picker + inline create |

Router matches longer patterns first — `exercise/:id/edit` and `workout/:id/active` and `workout/:id/add` are all matched before their shorter siblings.

**Navigation rule:** All Back/Cancel buttons must call `navigate('destination')` explicitly. Never use `history.back()` — it pops the hash stack and can resurface stale views (e.g. re-opening an edit page after saving).

**Tab bar:** The bottom tab bar lives in a persistent `#tabbar-root` element (sibling of `#app` in `index.html`), **not** inside each view's `.page`. `render()` calls `renderTabBar(active)` after dispatching: it builds the bar once, then only toggles the `.active` class on subsequent navigations, and clears the root on non-tab views. This keeps the bar out of the `.page` `fadeIn` animation so it never flickers when switching between Exercises and Workouts. Views themselves no longer emit `tabBarHTML()` — they just keep the `.has-tabs` class for bottom content padding.

## Data model

```js
// localStorage key: gym_exercises
[{ id, name, description, categories: string[], createdAt }]

// localStorage key: gym_workouts
[{ id, date, exerciseIds: string[], weights: { [exerciseId]: number | null }, finishedAt: string | null, createdAt }]
```

- `categories` is an array of value strings (e.g. `["biceps", "triceps"]`). Old exercises may have a legacy `category` string field — always read via `getCategories(exercise)` which handles both shapes without migrating data.
- Workouts store only `exerciseIds` (references), not copies. Exercises deleted from the general list are silently filtered out via `.filter(Boolean)`.
- `weights` maps exerciseId → kg (number) or `null` (bodyweight). Key absent means exercise was not marked done.
- `finishedAt` is set by `finishWorkout(id, weights)` when the user completes the active workout. `renderWorkoutDetail` uses this to switch between building mode and read-only summary mode. **`finishWorkout` also prunes `exerciseIds` to only the exercises present in `weights`** (i.e. the ones marked done) — exercises left unmarked are dropped from the saved workout, not persisted.
- `updateExercise(id, fields)` merges fields into an existing exercise.

## Localization (i18n)

The app ships in **Russian (default) and English**, switchable in Settings → Language. Current language is stored in `localStorage` key `gym_lang` (`getLang()` / `setLang()`, default `'ru'`).

- `TRANSLATIONS = { en: {...}, ru: {...} }` — flat dotted-key dictionary at the top of `app.js`. Every user-facing string goes through `t(key, params)`.
- `t(key, params)` looks up the current language, falls back to `en`, then to the raw key; interpolates `{name}` placeholders from `params`. Returns arrays as-is (used by `plural`).
- `plural(n, forms, lang)` — `forms` is `[one, many]` for EN, `[one, few, many]` for RU (correct Slavic rules). `countLabel(n, kind)` combines a number with the right declined word (`count.exercise` / `count.workout`), e.g. "3 упражнения" / "3 exercises".
- The `CATEGORIES` / `MUSCLE_GROUPS` `label` fields are **legacy/unused for display** — `categoryLabel(value)` and the pill builders resolve names via `t('muscle.'+value)` / `t('group.'+value)`. The `value` slugs are the stable identifiers.
- Dates use `toLocaleDateString(getLang()==='ru'?'ru-RU':'en-US', …)`; `formatDate` also localizes "Today"/"Yesterday".
- `render()` sets `document.documentElement.lang`. Switching language in Settings calls `setLang` then re-renders (`renderSettings()`), and every subsequent `render()` picks up the new language.
- **When adding any new UI string, add it to both `en` and `ru` in `TRANSLATIONS` and render it via `t()`** — never hardcode display text.

## Categories and muscle groups

Individual muscles are defined in `CATEGORIES` (14 values):

| Value | Label |
|-------|-------|
| `biceps` | Biceps |
| `triceps` | Triceps |
| `shoulders` | Shoulders |
| `pecs` | Pecs |
| `lats` | Lats |
| `rhomboids` | Rhomboids |
| `trapezius` | Trapezius |
| `abs` | Abs |
| `obliques` | Obliques |
| `lower_back` | Lower Back |
| `glutes` | Glutes |
| `hamstrings` | Hamstrings |
| `quads` | Quads |
| `calves` | Calves |

High-level groups are defined in `MUSCLE_GROUPS` (5 groups):

| Value | Label | Member muscles |
|-------|-------|----------------|
| `arms` | Arms | biceps, triceps, shoulders |
| `chest` | Chest | pecs |
| `back` | Back | lats, rhomboids, trapezius, lower_back |
| `core` | Core | abs, obliques |
| `legs` | Legs | glutes, hamstrings, quads, calves |

`categoryLabel(value)` resolves a muscle slug to its display string. `getCategories(exercise)` handles the old `category: string` shape and new `categories: string[]` shape.

## Exercise icons

`GROUP_ICONS` holds inline SVG strings (minimalistic stroke style, `stroke="white"` explicit) for each of the 5 groups. `exerciseIconHTML(exercise)` returns a `<div class="exercise-card-icon icon-{group}">…svg…</div>` by matching the exercise's categories to a group. Per-group colors are set via `.icon-arms`, `.icon-chest`, etc. CSS classes.

`workoutGroupIconsHTML(workout, allExercises)` returns a row of small (`.icon-xs`) group icons for a finished workout, walking `MUSCLE_GROUPS` in canonical order and emitting one icon per group that appears in the workout.

## Exercise list

`renderList()` sorts exercises by their primary muscle group (index in `MUSCLE_GROUPS` order: Arms → Chest → Back → Core → Legs). Exercises with no recognized group sort to the bottom. The underlying `localStorage` order is untouched.

## Workout list

`renderWorkouts()` shows each workout as a card: date name + exercise count on the left, and for finished workouts a row of small group icons (`.workout-group-icons`) on the right. Unfinished workouts show only the count.

## Workout flow

**Building:** `#workout/:id` — add/remove exercises, then tap "Start Workout" → navigates to `#workout/:id/active`. A workout is persisted to `localStorage` at creation (`renderWorkoutNew` → `createWorkout`), so backing out is treated as a discard, not a save: `goBack()` deletes an **empty** workout silently, and for a non-empty unstarted workout shows a discard confirm that deletes on OK. Building mode should never leave an unstarted/empty workout in the list.

**Active:** `#workout/:id/active` — each exercise has a "Done" button. Tapping it opens an inline weight dropdown (slides down from under the card). User enters kg or taps "No weight" (bodyweight). The dropdown pre-fills with the previous weight for that exercise (from `getPrevWeight(exerciseId)` which scans finished workouts). Done exercises show a green checkmark + weight badge. "Finish Workout" → `finishWorkout(id, doneWeights)` saves weights to localStorage → `showSavePopup()` → navigate to workouts list. Only exercises the user marked done are kept — undone exercises are pruned from `exerciseIds` at finish time.

**Summary:** `#workout/:id` for a finished workout — read-only list of exercises with weight badges. Each exercise also shows a weight delta (`+X kg` in green / `−X kg` in red) compared to the most recent finished workout that predates this one (filtered by `finishedAt <` current workout's `finishedAt`). No delta shown for bodyweight exercises or when no prior session exists. Zero delta shows nothing.

**Generate flow:** `#workout/generate` — user picks muscle groups (Arms/Chest/Back/Core/Legs), taps Generate → preview appears → "Start Workout" creates the workout and goes directly to `#workout/:id/active`.

## Generator algorithm

`generateExercises(selectedGroupValues)` uses a **group-level round-robin** with two-level recency scoring:

1. Scan recent finished workouts (sorted by `finishedAt` desc) and build two maps:
   - `exerciseRecency[exId]` — how recently that *exact* exercise was used, over a **6-workout** lookback. Uses `Math.max` so the value reflects the most-recent usage (workout `i` back scores `6 − i`). Deep window so it catches repeats across same-group sessions that are several workouts apart (e.g. arms → legs → arms).
   - `categoryRecency[cat]` — how recently the *muscle* was trained, over a **3-workout** lookback, weights 3 → 2 → 1 summed.
2. `recencyScore(ex) = exerciseRecency[ex.id] * 100 + Σ categoryRecency[cat]`. The exercise term is scaled by 100 so it **dominates**: any recent use of the exact exercise outweighs every possible category penalty. This is what enforces *"don't repeat the same exercise in consecutive same-group workouts if an alternative exists"* — a fresh alternative always sorts ahead of a repeat. The category term is secondary: it spreads muscle load across days and breaks ties between two equally-fresh exercises.
3. Each selected group gets a pool of matching exercises: shuffled first (random tie-breaking), then stable-sorted ascending by `recencyScore` so fresh exercises rise to the front.
4. `MAX_PER_GROUP = Math.max(Math.ceil(5 / numGroups), 2)` — scales so fewer groups contribute more each (1 group → 5, 2 → 3, 3–5 → 2).
5. Each iteration picks the least-served group (by count) and takes the first eligible exercise from its pool.
6. **No analogous exercises within a workout:** an exercise is skipped if its canonical muscle key (`getCategories(e).slice().sort().join(',')`) is already represented. This means two exercises tagged identically (e.g. both `[biceps]`) cannot both appear.
7. If a group has no eligible exercises left it is saturated (skipped in future rounds).
8. Loop stops at 5 exercises or when all groups are saturated.
9. Final shuffle randomises display order.

Three concerns handled together: **exercise-level recency** avoids repeating the same exercise across nearby same-group sessions (if an alternative exists); **category-level recency** spreads muscle load across days; the **muscle-key check** deduplicates within a single workout.

## Weight history chart

`buildWeightChart(exerciseId, days)` renders an inline SVG chart on the exercise detail page. Period tabs (7d / 1m / 3m) re-render only `#chart-body` via `setChartPeriod(days)`.

- Only finished workouts with a numeric (non-null) weight for this exercise are plotted.
- 0 data points → empty-state message. 1 data point → single-value message (no line).
- Smooth curve uses **Catmull-Rom → cubic Bézier** conversion (`alpha = 0.5`): tangent at each point = `alpha * (p_next − p_prev)`; control points = `p1 + T1/3` and `p2 − T2/3`. Rendered as SVG `C` commands.
- Y-axis: 3 guide lines at min / mid / max weight with labels. A padding of 15% of the range (min 5 kg) prevents data points from touching the chart edges.
- X-axis: 2 labels for 7d, 3 for 1m/3m, anchored start/end to avoid clipping.
- Fill area under curve at 8% accent opacity, constructed by appending `L` commands to the existing path string.

## Backup (export / import)

Reached via the gear icon in the Exercises header → `#settings` (`renderSettings()`). The settings screen has three sections: **Language** (RU/EN pills, see Localization), then **Export** and **Import**. Guards against data loss when the app's WKWebView container is wiped (app deletion, bundle-ID change, or the 7-day free-provisioning re-sign cycle if the app is ever deleted rather than reinstalled over).

- `exportData()` → pretty-printed JSON `{ app, version, exportedAt, exercises, workouts }` (both localStorage keys).
- `parseBackup(raw)` → validates (must have array `exercises` + `workouts`), throws a user-readable `Error` otherwise.
- `importData(data)` → overwrites both localStorage keys.
- Export UI shows the JSON in a read-only textarea + Copy button. Copy uses `document.execCommand('copy')` after `select()`+`setSelectionRange()` (the `navigator.clipboard` API is unavailable on `file://` origins in WKWebView, so execCommand is the reliable path; clipboard API is attempted as a bonus).
- **Export to a File** button posts the JSON over a native bridge: `window.webkit.messageHandlers.backup.postMessage(exportData())`. The JS guards on `window.webkit?.messageHandlers?.backup` — in a plain browser (no bridge) it shows an inline "only in the iOS app" hint instead. Fresh JSON is generated on each tap.
- **Import from a File** button posts to `window.webkit.messageHandlers.importFile` (empty body — it's just a trigger). Native opens the Files picker and calls back into `window.__importFromNative(text)` with the file contents. That global handler (defined at top level so it survives re-renders) runs the same validate → `showConfirm(..., 'Replace')` → overwrite flow, writing errors to `.import-error` if the settings screen is mounted, else falling back to a modal.
- Import UI also accepts pasted JSON: validates on submit, shows inline errors in `.import-error`, then routes through `showConfirm(..., 'Replace')` before overwriting.

### Native backup bridge (`ContentView.swift`)

`Coordinator` conforms to `WKScriptMessageHandler` and `UIDocumentPickerDelegate`; `makeUIView` builds a `WKWebViewConfiguration` and registers **two** handlers: `backup` and `importFile`. It also stores a `weak var webView` reference on the coordinator so native code can call back into JS.

- **Export (`backup`)** writes the JSON to a dated temp file (`gym-backup-YYYY-MM-DD.json`) and presents a `UIActivityViewController` (iOS share sheet) so the user can **Save to Files** (iCloud Drive / On My iPhone) — survives app deletion and the weekly re-sign cycle.
- **Import (`importFile`)** presents a `UIDocumentPickerViewController(forOpeningContentTypes: [.json, .plainText])`. On pick it wraps the file in a security-scoped resource access, reads the text, and returns it to the web layer via `webView.evaluateJavaScript("window.__importFromNative(<arg>[0])")`. The file text is passed as a JSON-array-wrapped string (`JSONSerialization`) so quotes/newlines/unicode are safely escaped into a JS string literal.

No special Xcode capability or entitlement is required (works on a free personal-team account). `Coordinator.topViewController()` walks `presentedViewController` so sheets/pickers aren't presented on an already-presenting VC; the same helper is used by the JS `confirm()` panel handler.

## Custom UI patterns

**Confirm modal:** `showConfirm(message, onOk, okLabel = 'Delete')` — appends a DOM overlay instead of using `window.confirm()`, which is unreliable in WKWebView. Used for all destructive actions. `okLabel` customises the confirm-button text (e.g. `'Replace'` for import).

**Save popup:** `showSavePopup()` — animated SVG checkmark overlay, navigates to workouts then fades out.

**Weight dropdown:** Inline DOM panel that slides down from below the exercise card using a CSS `max-height` transition (0 → 160px). Only one open at a time; state is a closure-local `openDropdownEid` variable. Rebuilds the list HTML on every state change (`rebuildList()`).

## Design tokens (CSS variables)

```
--bg: #0F0F0F   --surface: #1A1A1A   --card: #242424
--accent: #FF6B00   --accent-dim: #CC5500   --text: #FFFFFF
--muted: #999999   --border: #333333   --danger: #E53935   --radius: 14px
```

Safe area insets: `env(safe-area-inset-top/bottom)` used in `.page` padding and `.tab-bar` height.

Double-tap zoom is disabled via `user-scalable=no` in the viewport meta tag and `touch-action: manipulation` on the universal CSS selector.

## Xcode setup

1. New Xcode project → iOS App, SwiftUI, Swift
2. Add the web assets as a **folder reference** (blue folder), not individual copies: drag the folder into the Project Navigator and choose **“Create folder references”** + add to target. New JS files (e.g. the five split scripts) are then picked up automatically — no need to re-add each one. (If any files were previously added as individual yellow-group copies, remove those references first, keeping only the folder reference.)
3. Replace generated `ContentView.swift` with the one in this folder
4. Set deployment target to **iOS 16.0** (General → Minimum Deployments)
5. ⌘R to build and install on device

`WKWebView` loads files via `loadFileURL(_:allowingReadAccessTo:)` — the second argument (parent directory) is required so the page can load sibling CSS/JS files. `ContentView.swift` includes a `WKUIDelegate` coordinator so JS alert/confirm panels work if needed (though the app uses custom DOM modals instead).

To update the app after editing web files: with a **folder reference**, just replace the folder’s contents on disk (they’re referenced in place) and ⌘R — no per-file re-adding. The five JS files (`i18n.js`, `store.js`, `ui.js`, `views.js`, `app.js`) plus `index.html`/`style.css` all live in that folder.

## XSS note

All user content is passed through `escHtml()` before insertion into `innerHTML`. Do not bypass this when adding new views that render exercise names, descriptions, or category labels.
