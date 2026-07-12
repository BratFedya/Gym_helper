// store.js — data layer & domain logic (no DOM). Loaded after i18n.js.
// Holds localStorage keys, domain constants (CATEGORIES/MUSCLE_GROUPS),
// exercise/workout CRUD, backup import/export, and the workout generator.

const EXERCISES_KEY = 'gym_exercises';
const WORKOUTS_KEY  = 'gym_workouts';

// ─── Categories (domain data) ─────────────────────────────────────────────────
// Display labels come from i18n (`t('muscle.'+value)`); the `label` fields here
// are legacy/unused for rendering. The `value` slugs are the stable identifiers.

const CATEGORIES = [
  { value: 'biceps',     label: 'Biceps' },
  { value: 'triceps',    label: 'Triceps' },
  { value: 'shoulders',  label: 'Shoulders' },
  { value: 'pecs',       label: 'Pecs' },
  { value: 'lats',       label: 'Lats' },
  { value: 'rhomboids',  label: 'Rhomboids' },
  { value: 'trapezius', label: 'Trapezius' },
  { value: 'abs',        label: 'Abs' },
  { value: 'obliques',  label: 'Obliques' },
  { value: 'lower_back', label: 'Lower Back' },
  { value: 'glutes',     label: 'Glutes' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'quads',      label: 'Quads' },
  { value: 'calves',     label: 'Calves' },
];

const MUSCLE_GROUPS = [
  { value: 'arms',  label: 'Arms',  categories: ['biceps', 'triceps', 'shoulders'] },
  { value: 'chest', label: 'Chest', categories: ['pecs'] },
  { value: 'back',  label: 'Back',  categories: ['lats', 'rhomboids', 'trapezius', 'lower_back'] },
  { value: 'core',  label: 'Core',  categories: ['abs', 'obliques'] },
  { value: 'legs',  label: 'Legs',  categories: ['glutes', 'hamstrings', 'quads', 'calves'] },
];

function expandGroups(selectedGroupValues) {
  return selectedGroupValues.flatMap(g =>
    MUSCLE_GROUPS.find(mg => mg.value === g)?.categories || []
  );
}

// Backward compat: old exercises may have category (string) instead of categories (array)
function getCategories(exercise) {
  if (Array.isArray(exercise.categories)) return exercise.categories;
  if (exercise.category) return [exercise.category];
  return [];
}

// ─── Exercise data ────────────────────────────────────────────────────────────

function loadExercises() {
  try { return JSON.parse(localStorage.getItem(EXERCISES_KEY)) || []; }
  catch { return []; }
}
function saveExercises(list) { localStorage.setItem(EXERCISES_KEY, JSON.stringify(list)); }

function addExercise(name, description, categories) {
  const list = loadExercises();
  const ex = { id: crypto.randomUUID(), name, description, categories, createdAt: new Date().toISOString() };
  list.push(ex);
  saveExercises(list);
  return ex;
}

function updateExercise(id, fields) {
  const list = loadExercises();
  const idx = list.findIndex(e => e.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...fields };
  saveExercises(list);
}

function deleteExercise(id) { saveExercises(loadExercises().filter(e => e.id !== id)); }
function getExercise(id)    { return loadExercises().find(e => e.id === id) || null; }

// ─── Workout data ─────────────────────────────────────────────────────────────

function loadWorkouts() {
  try { return JSON.parse(localStorage.getItem(WORKOUTS_KEY)) || []; }
  catch { return []; }
}
function saveWorkouts(list) { localStorage.setItem(WORKOUTS_KEY, JSON.stringify(list)); }

function createWorkout(date) {
  const list = loadWorkouts();
  const w = { id: crypto.randomUUID(), date, exerciseIds: [], createdAt: new Date().toISOString() };
  list.push(w);
  saveWorkouts(list);
  return w;
}
function getWorkout(id)    { return loadWorkouts().find(w => w.id === id) || null; }
function deleteWorkout(id) { saveWorkouts(loadWorkouts().filter(w => w.id !== id)); }

function addExToWorkout(workoutId, exerciseId) {
  const list = loadWorkouts();
  const w = list.find(w => w.id === workoutId);
  if (w && !w.exerciseIds.includes(exerciseId)) {
    w.exerciseIds.push(exerciseId);
    saveWorkouts(list);
  }
}

function removeExFromWorkout(workoutId, exerciseId) {
  const list = loadWorkouts();
  const w = list.find(w => w.id === workoutId);
  if (w) { w.exerciseIds = w.exerciseIds.filter(id => id !== exerciseId); saveWorkouts(list); }
}

function finishWorkout(id, weights) {
  const list = loadWorkouts();
  const w = list.find(w => w.id === id);
  if (w) {
    // Drop exercises the user never marked done — only completed ones are saved.
    // Original order is preserved by filtering the existing exerciseIds.
    w.exerciseIds = w.exerciseIds.filter(eid =>
      Object.prototype.hasOwnProperty.call(weights, eid)
    );
    w.weights = weights;
    w.finishedAt = new Date().toISOString();
    saveWorkouts(list);
  }
}

// Returns { found: true, value: number | null } or { found: false }
// value === null means bodyweight was used; value === number means kg weight
function getPrevWeight(exerciseId) {
  const finished = loadWorkouts()
    .filter(w => w.finishedAt && w.weights)
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
  for (const w of finished) {
    if (Object.prototype.hasOwnProperty.call(w.weights, exerciseId)) {
      return { found: true, value: w.weights[exerciseId] };
    }
  }
  return { found: false };
}

// ─── Backup (export / import) ─────────────────────────────────────────────────

// Serialises both localStorage keys into one portable JSON string.
function exportData() {
  return JSON.stringify({
    app: 'gym-helper',
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises: loadExercises(),
    workouts: loadWorkouts(),
  }, null, 2);
}

// Parses and validates a backup string. Returns the parsed payload on success,
// or throws an Error with a user-readable message on failure.
function parseBackup(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(t('import.invalidJson'));
  }
  if (!data || !Array.isArray(data.exercises) || !Array.isArray(data.workouts))
    throw new Error(t('import.notBackup'));
  return data;
}

// Overwrites all data with a validated backup payload.
function importData(data) {
  saveExercises(data.exercises);
  saveWorkouts(data.workouts);
}

// Called by native code (ContentView.swift) after the user picks a file in the
// Files picker. Defined on window so it survives re-renders and always exists
// when the bridge calls back. Runs the full validate → confirm → import flow,
// independent of whether the settings screen is currently mounted.
// (References showConfirm/navigate from ui.js/app.js — resolved at call time.)
window.__importFromNative = function (text) {
  const errEl = document.getElementById('import-error');
  let data;
  try {
    data = parseBackup(text);
  } catch (e) {
    if (errEl) errEl.textContent = e.message;
    else showConfirm(e.message, () => {}, t('btn.ok'));
    return;
  }
  showConfirm(
    t('confirm.replaceFile', { ex: data.exercises.length, w: data.workouts.length }),
    () => { importData(data); navigate('list'); },
    t('btn.replace')
  );
};

// ─── Workout generator ───────────────────────────────────────────────────────

function generateExercises(selectedGroupValues) {
  const all = loadExercises();
  const numGroups = selectedGroupValues.length;
  const MAX_PER_GROUP = Math.max(Math.ceil(5 / numGroups), 2);

  // Two recency signals, computed from recent finished workouts:
  //
  // 1. exerciseRecency — how recently THIS exact exercise was used. Deep
  //    lookback (6 workouts) so it catches repeats across same-group sessions
  //    that may be several workouts apart (e.g. arms → legs → arms). This is
  //    the dominant term: if there is any alternative exercise for a muscle,
  //    a recently-used one must not be picked again.
  // 2. categoryRecency — how recently the muscle itself was trained (last 3
  //    workouts). Secondary term that spreads muscle load across days and
  //    breaks ties between two equally-fresh exercises.
  const exMap = Object.fromEntries(all.map(e => [e.id, e]));
  const EX_LOOKBACK = 6, CAT_LOOKBACK = 3;
  const recent = loadWorkouts()
    .filter(w => w.finishedAt)
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
    .slice(0, EX_LOOKBACK);

  const exerciseRecency = {};
  const categoryRecency = {};
  recent.forEach((w, i) => {
    // Most-recent usage wins: workout i back scores (EX_LOOKBACK - i)
    const exWeight = EX_LOOKBACK - i;
    w.exerciseIds.forEach(eid => {
      exerciseRecency[eid] = Math.max(exerciseRecency[eid] || 0, exWeight);
      if (i < CAT_LOOKBACK) {
        const ex = exMap[eid];
        if (ex) getCategories(ex).forEach(cat => {
          categoryRecency[cat] = (categoryRecency[cat] || 0) + (CAT_LOOKBACK - i);
        });
      }
    });
  });

  // Exercise term is scaled to dominate: any recent use of the exact exercise
  // outweighs every possible category penalty, so a fresh alternative always
  // sorts ahead of a repeat.
  function recencyScore(exercise) {
    const exScore = (exerciseRecency[exercise.id] || 0) * 100;
    const catScore = getCategories(exercise).reduce((sum, c) => sum + (categoryRecency[c] || 0), 0);
    return exScore + catScore;
  }

  // Each group gets its own pool: shuffle first (so ties are random), then
  // stable-sort by recency score so fresh exercises rise to the front.
  const groups = selectedGroupValues.map(gv => {
    const mg = MUSCLE_GROUPS.find(m => m.value === gv);
    const pool = all
      .filter(e => getCategories(e).some(c => mg.categories.includes(c)))
      .sort(() => Math.random() - 0.5)
      .sort((a, b) => recencyScore(a) - recencyScore(b));
    return { value: gv, pool };
  });

  // Canonical identity for a muscle set — order-independent
  const muscleKey = e => getCategories(e).slice().sort().join(',');

  const picked = [];
  const pickedIds = new Set();
  const pickedMuscleKeys = new Set();
  const groupCount = Object.fromEntries(groups.map(g => [g.value, 0]));

  while (picked.length < 5) {
    const openGroups = groups.filter(g => groupCount[g.value] < MAX_PER_GROUP);
    if (!openGroups.length) break;

    // Pick the least-served group; ties keep original selection order
    const target = openGroups.reduce((a, b) =>
      groupCount[a.value] <= groupCount[b.value] ? a : b
    );

    // Skip exercises whose exact muscle combination is already represented
    const ex = target.pool.find(e => !pickedIds.has(e.id) && !pickedMuscleKeys.has(muscleKey(e)));
    if (!ex) {
      groupCount[target.value] = MAX_PER_GROUP;
      continue;
    }

    picked.push(ex);
    pickedIds.add(ex.id);
    pickedMuscleKeys.add(muscleKey(ex));
    groupCount[target.value]++;
  }

  // Final shuffle so the display order doesn't always reflect recency rank
  picked.sort(() => Math.random() - 0.5);
  return picked;
}
