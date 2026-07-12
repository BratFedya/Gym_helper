// app.js — router & entry point. Loaded LAST (after i18n/store/ui/views).
// Hash-based routing + the render() dispatcher. The event listeners fire only
// after DOMContentLoaded, by which point every earlier file has defined its
// globals, so cross-file calls are safe.

// ─── Router ───────────────────────────────────────────────────────────────────

function getRoute() {
  const hash = location.hash.slice(1) || 'list';
  let m;
  if (hash === 'list' || hash === 'exercises') return { view: 'list' };
  if (hash === 'add')              return { view: 'add' };
  if (hash === 'workouts')         return { view: 'workouts' };
  if (hash === 'settings')         return { view: 'settings' };
  if (hash === 'workout/new')      return { view: 'workout-new' };
  if (hash === 'workout/generate') return { view: 'workout-generate' };
  m = hash.match(/^workout\/([^/]+)\/add$/);
  if (m) return { view: 'workout-add', workoutId: m[1] };
  m = hash.match(/^workout\/([^/]+)\/active$/);
  if (m) return { view: 'workout-active', id: m[1] };
  m = hash.match(/^workout\/([^/]+)$/);
  if (m) return { view: 'workout-detail', id: m[1] };
  m = hash.match(/^exercise\/(.+)\/edit$/);
  if (m) return { view: 'exercise-edit', id: m[1] };
  m = hash.match(/^exercise\/(.+)$/);
  if (m) return { view: 'exercise', id: m[1] };
  return { view: 'list' };
}

function navigate(hash) { location.hash = hash; }

// ─── Entry ────────────────────────────────────────────────────────────────────

function render() {
  document.documentElement.lang = getLang();
  const r = getRoute();
  if      (r.view === 'list')           renderList();
  else if (r.view === 'add')            renderAdd();
  else if (r.view === 'exercise')       renderExercise(r.id);
  else if (r.view === 'exercise-edit')  renderEditExercise(r.id);
  else if (r.view === 'workouts')       renderWorkouts();
  else if (r.view === 'settings')       renderSettings();
  else if (r.view === 'workout-new')      renderWorkoutNew();
  else if (r.view === 'workout-generate') renderWorkoutGenerate();
  else if (r.view === 'workout-detail')   renderWorkoutDetail(r.id);
  else if (r.view === 'workout-active')   renderWorkoutActive(r.id);
  else if (r.view === 'workout-add')    renderWorkoutAddExercise(r.workoutId);
  else renderList();

  // Persistent tab bar (outside the animated .page) — shown only on the two tab views
  if (r.view === 'list')          renderTabBar('exercises');
  else if (r.view === 'workouts') renderTabBar('workouts');
  else                            renderTabBar(null);
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
