// views.js — screen render functions. Loaded after ui.js, before app.js.
// Each render* function writes into #app; depends on i18n, store, and ui.

// ─── Views ────────────────────────────────────────────────────────────────────

function renderList() {
  const exercises = loadExercises().slice().sort((a, b) => {
    const groupIndex = e => {
      const cats = getCategories(e);
      const idx = MUSCLE_GROUPS.findIndex(g => cats.some(c => g.categories.includes(c)));
      return idx === -1 ? MUSCLE_GROUPS.length : idx;
    };
    return groupIndex(a) - groupIndex(b);
  });
  document.getElementById('app').innerHTML = `
    <div class="page has-tabs">
      <div class="header">
        <h1>${t('tab.exercises')}</h1>
        <button class="btn-icon" id="settings-btn" aria-label="${t('settings.title')}">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
      <div class="content">
        ${exercises.length === 0 ? `
          <div class="empty-state">
            <h2>${t('exercises.empty.title')}</h2>
            <p>${t('exercises.empty.body')}</p>
          </div>
        ` : `
          <div class="exercise-list">
            ${exercises.map(e => {
              const cats = getCategories(e);
              const catText = cats.length ? cats.map(categoryLabel).join(', ') : '—';
              return `
                <div class="exercise-card" data-id="${e.id}">
                  ${exerciseIconHTML(e)}
                  <div class="exercise-card-info">
                    <div class="exercise-card-name">${escHtml(e.name)}</div>
                    <div class="exercise-card-preview">${escHtml(catText)}</div>
                  </div>
                  ${chevronRight}
                </div>`;
            }).join('')}
          </div>
        `}
      </div>
      <button class="fab fab-tabbed" id="fab">+</button>
    </div>
  `;
  document.getElementById('fab').addEventListener('click', () => navigate('add'));
  document.getElementById('settings-btn').addEventListener('click', () => navigate('settings'));
  document.querySelectorAll('.exercise-card').forEach(card =>
    card.addEventListener('click', () => navigate(`exercise/${card.dataset.id}`))
  );
}

function renderSettings() {
  const exCount = loadExercises().length;
  const wCount  = loadWorkouts().length;
  const json    = exportData();

  const curLang = getLang();
  document.getElementById('app').innerHTML = `
    <div class="page">
      <div class="header">
        <button class="btn-back" id="back">${backArrow} ${t('btn.back')}</button>
        <h1>${t('settings.title')}</h1>
      </div>
      <div class="content">
        <p class="section-label">${t('settings.language')}</p>
        <div class="cat-grid" id="lang-grid">
          ${LANGUAGES.map(l => `
            <button type="button" class="cat-pill lang-pill ${l.value === curLang ? 'cat-pill-active' : ''}" data-lang="${l.value}">
              ${escHtml(l.label)}
            </button>
          `).join('')}
        </div>

        <div class="divider"></div>

        <p class="section-label">${t('settings.export')}</p>
        <p class="generate-note">${escHtml(t('settings.exportHint', { ex: countLabel(exCount, 'exercise'), w: countLabel(wCount, 'workout') }))}</p>
        <textarea class="form-textarea backup-box" id="export-box" readonly>${escHtml(json)}</textarea>
        <button class="btn btn-primary" id="copy-btn">${t('btn.copy')}</button>
        <button class="btn btn-ghost" id="file-btn">${t('btn.exportFile')}</button>

        <div class="divider"></div>

        <p class="section-label">${t('settings.import')}</p>
        <p class="generate-note">${escHtml(t('settings.importHint'))}</p>
        <button class="btn btn-primary" id="importfile-btn">${t('btn.importFile')}</button>
        <textarea class="form-textarea backup-box" id="import-box" placeholder="${escHtml(t('ph.pasteBackup'))}" style="margin-top:12px"></textarea>
        <p class="import-error" id="import-error"></p>
        <button class="btn btn-danger" id="import-btn" style="margin-top:12px">${t('btn.importReplace')}</button>
      </div>
    </div>
  `;

  document.getElementById('back').addEventListener('click', () => navigate('list'));

  document.querySelectorAll('.lang-pill').forEach(btn =>
    btn.addEventListener('click', () => {
      if (btn.dataset.lang === getLang()) return;
      setLang(btn.dataset.lang);
      renderSettings(); // re-render this screen in the new language
    })
  );

  document.getElementById('copy-btn').addEventListener('click', () => {
    const box = document.getElementById('export-box');
    box.focus();
    box.select();
    box.setSelectionRange(0, box.value.length); // iOS needs an explicit range
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* not supported */ }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(box.value).catch(() => {});
    const btn = document.getElementById('copy-btn');
    btn.textContent = ok ? t('btn.copied') : t('btn.copySelected');
    setTimeout(() => { btn.textContent = t('btn.copy'); }, 2200);
  });

  document.getElementById('file-btn').addEventListener('click', () => {
    const btn = document.getElementById('file-btn');
    // Native bridge only exists inside the iOS app (registered in ContentView.swift)
    const bridge = window.webkit?.messageHandlers?.backup;
    if (!bridge) {
      btn.textContent = t('btn.onlyInApp');
      setTimeout(() => { btn.textContent = t('btn.exportFile'); }, 2200);
      return;
    }
    bridge.postMessage(exportData()); // fresh JSON each tap → opens iOS share sheet
  });

  document.getElementById('importfile-btn').addEventListener('click', () => {
    const btn = document.getElementById('importfile-btn');
    // Native bridge opens the Files picker; result comes back via window.__importFromNative
    const bridge = window.webkit?.messageHandlers?.importFile;
    if (!bridge) {
      btn.textContent = t('btn.onlyInApp');
      setTimeout(() => { btn.textContent = t('btn.importFile'); }, 2200);
      return;
    }
    document.getElementById('import-error').textContent = '';
    bridge.postMessage('');
  });

  document.getElementById('import-btn').addEventListener('click', () => {
    const errEl = document.getElementById('import-error');
    const raw = document.getElementById('import-box').value.trim();
    errEl.textContent = '';
    if (!raw) { errEl.textContent = t('import.pasteFirst'); return; }
    let data;
    try {
      data = parseBackup(raw);
    } catch (e) {
      errEl.textContent = e.message;
      return;
    }
    showConfirm(
      t('confirm.replaceBackup', { ex: data.exercises.length, w: data.workouts.length }),
      () => { importData(data); navigate('list'); },
      t('btn.replace')
    );
  });
}

function renderAdd() {
  document.getElementById('app').innerHTML = `
    <div class="page">
      <div class="header">
        <button class="btn-back" id="back">${backArrow} ${t('btn.back')}</button>
        <h1>${t('exercise.new')}</h1>
      </div>
      <div class="content">
        <div class="form-group">
          <label class="form-label" for="ex-name">${t('field.name')}</label>
          <input class="form-input" id="ex-name" type="text" placeholder="${escHtml(t('ph.name'))}" autocomplete="off" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('field.category')}</label>
          ${categoryPillsHTML()}
        </div>
        <div class="form-group">
          <label class="form-label" for="ex-desc">${t('field.description')}</label>
          <textarea class="form-textarea" id="ex-desc" placeholder="${escHtml(t('ph.desc'))}"></textarea>
        </div>
        <button class="btn btn-primary" id="save">${t('btn.save')}</button>
        <button class="btn btn-ghost" id="cancel">${t('btn.cancel')}</button>
      </div>
    </div>
  `;
  document.getElementById('back').addEventListener('click', () => navigate('list'));
  document.getElementById('cancel').addEventListener('click', () => navigate('list'));
  document.getElementById('save').addEventListener('click', () => {
    const name = document.getElementById('ex-name').value.trim();
    const cats = readSelectedCategories();
    if (!name) {
      const inp = document.getElementById('ex-name');
      inp.focus(); inp.style.borderColor = '#E53935'; return;
    }
    if (!cats.length) {
      document.getElementById('cat-grid').classList.add('cat-grid-error');
      return;
    }
    addExercise(name, document.getElementById('ex-desc').value.trim(), cats);
    navigate('list');
  });
  document.getElementById('ex-name').addEventListener('input', e => { e.target.style.borderColor = ''; });
  document.querySelectorAll('.cat-pill').forEach(btn =>
    btn.addEventListener('click', () => {
      btn.classList.toggle('cat-pill-active');
      document.getElementById('cat-grid').classList.remove('cat-grid-error');
    })
  );
  setTimeout(() => document.getElementById('ex-name')?.focus(), 200);
}

function renderExercise(id) {
  const exercise = getExercise(id);
  if (!exercise) { navigate('list'); return; }
  const date = new Date(exercise.createdAt).toLocaleDateString(getLang() === 'ru' ? 'ru-RU' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const cats = getCategories(exercise);
  document.getElementById('app').innerHTML = `
    <div class="page">
      <div class="header">
        <button class="btn-back" id="back">${backArrow} ${t('btn.back')}</button>
        <h1>${t('exercise.one')}</h1>
        <button class="btn-edit" id="edit">${t('btn.edit')}</button>
      </div>
      <div class="content">
        <div class="detail-name">${escHtml(exercise.name)}</div>
        ${cats.length ? `
          <div class="detail-categories">
            ${cats.map(c => `<span class="detail-category">${escHtml(categoryLabel(c))}</span>`).join('')}
          </div>
        ` : ''}
        ${exercise.description
          ? `<div class="detail-description">${escHtml(exercise.description)}</div>`
          : `<div class="detail-description" style="color:var(--muted);font-style:italic">${t('exercise.noDesc')}</div>`}
        <div class="detail-meta">${escHtml(t('exercise.added', { date }))}</div>
        <div class="chart-wrap">
          <div class="chart-header">
            <span class="section-label" style="margin:0">${t('chart.title')}</span>
            <div class="chart-tabs">
              <button class="chart-tab chart-tab-active" data-days="7">7d</button>
              <button class="chart-tab" data-days="30">1m</button>
              <button class="chart-tab" data-days="90">3m</button>
            </div>
          </div>
          <div id="chart-body"></div>
        </div>
        <button class="btn btn-danger" id="delete">${t('btn.deleteExercise')}</button>
      </div>
    </div>
  `;
  document.getElementById('back').addEventListener('click', () => navigate('list'));
  document.getElementById('edit').addEventListener('click', () => navigate(`exercise/${id}/edit`));

  function setChartPeriod(days) {
    document.querySelectorAll('.chart-tab').forEach(t =>
      t.classList.toggle('chart-tab-active', +t.dataset.days === days)
    );
    document.getElementById('chart-body').innerHTML = buildWeightChart(id, days);
  }
  setChartPeriod(7);
  document.querySelectorAll('.chart-tab').forEach(btn =>
    btn.addEventListener('click', () => setChartPeriod(+btn.dataset.days))
  );

  document.getElementById('delete').addEventListener('click', () => {
    showConfirm(t('confirm.deleteExercise', { name: exercise.name }), () => { deleteExercise(id); navigate('list'); });
  });
}

function renderEditExercise(id) {
  const exercise = getExercise(id);
  if (!exercise) { navigate('list'); return; }
  const currentCats = getCategories(exercise);
  document.getElementById('app').innerHTML = `
    <div class="page">
      <div class="header">
        <button class="btn-back" id="back">${backArrow} ${t('btn.back')}</button>
        <h1>${t('exercise.edit')}</h1>
      </div>
      <div class="content">
        <div class="form-group">
          <label class="form-label" for="ex-name">${t('field.name')}</label>
          <input class="form-input" id="ex-name" type="text" value="${escHtml(exercise.name)}" autocomplete="off" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('field.category')}</label>
          ${categoryPillsHTML(currentCats)}
        </div>
        <div class="form-group">
          <label class="form-label" for="ex-desc">${t('field.description')}</label>
          <textarea class="form-textarea" id="ex-desc" placeholder="${escHtml(t('ph.desc'))}">${escHtml(exercise.description || '')}</textarea>
        </div>
        <button class="btn btn-primary" id="save">${t('btn.saveChanges')}</button>
        <button class="btn btn-ghost" id="cancel">${t('btn.cancel')}</button>
      </div>
    </div>
  `;
  document.getElementById('back').addEventListener('click', () => navigate('list'));
  document.getElementById('cancel').addEventListener('click', () => navigate('list'));
  document.getElementById('save').addEventListener('click', () => {
    const name = document.getElementById('ex-name').value.trim();
    const cats = readSelectedCategories();
    if (!name) {
      const inp = document.getElementById('ex-name');
      inp.focus(); inp.style.borderColor = '#E53935'; return;
    }
    if (!cats.length) {
      document.getElementById('cat-grid').classList.add('cat-grid-error');
      return;
    }
    updateExercise(id, {
      name,
      description: document.getElementById('ex-desc').value.trim(),
      categories: cats,
    });
    navigate('list');
  });
  document.getElementById('ex-name').addEventListener('input', e => { e.target.style.borderColor = ''; });
  document.querySelectorAll('.cat-pill').forEach(btn =>
    btn.addEventListener('click', () => {
      btn.classList.toggle('cat-pill-active');
      document.getElementById('cat-grid').classList.remove('cat-grid-error');
    })
  );
}

function renderWorkouts() {
  const workouts = loadWorkouts().slice().sort((a, b) => b.date.localeCompare(a.date));
  const allExercises = loadExercises();
  document.getElementById('app').innerHTML = `
    <div class="page has-tabs">
      <div class="header">
        <h1>${t('tab.workouts')}</h1>
      </div>
      <div class="content">
        ${workouts.length === 0 ? `
          <div class="empty-state">
            <h2>${t('workouts.empty.title')}</h2>
            <p>${t('workouts.empty.body')}</p>
          </div>
        ` : `
          <div class="exercise-list">
            ${workouts.map(w => {
              const n = w.exerciseIds.length;
              const label = n === 0 ? t('workout.noExercises') : countLabel(n, 'exercise');
              const icons = w.finishedAt ? workoutGroupIconsHTML(w, allExercises) : '';
              return `
                <div class="exercise-card" data-id="${w.id}">
                  <div class="exercise-card-info">
                    <div class="exercise-card-name">${escHtml(formatDate(w.date))}</div>
                    <div class="exercise-card-preview">${label}</div>
                  </div>
                  ${icons}
                  ${chevronRight}
                </div>`;
            }).join('')}
          </div>
        `}
      </div>
      <button class="fab fab-tabbed" id="fab">+</button>
    </div>
  `;
  document.getElementById('fab').addEventListener('click', () => navigate('workout/new'));
  document.querySelectorAll('.exercise-card').forEach(card =>
    card.addEventListener('click', () => navigate(`workout/${card.dataset.id}`))
  );
}

function renderWorkoutNew() {
  document.getElementById('app').innerHTML = `
    <div class="page">
      <div class="header">
        <button class="btn-back" id="back">${backArrow} ${t('btn.back')}</button>
        <h1>${t('workout.new')}</h1>
      </div>
      <div class="content">
        <div class="form-group">
          <label class="form-label" for="w-date">${t('field.date')}</label>
          <input class="form-input date-input" id="w-date" type="date" value="${todayISO()}" />
        </div>
        <button class="btn btn-primary" id="create">${t('btn.createWorkout')}</button>
        <button class="btn btn-ghost" id="generate">${t('btn.generateByGroup')}</button>
        <button class="btn btn-ghost" id="cancel">${t('btn.cancel')}</button>
      </div>
    </div>
  `;
  document.getElementById('back').addEventListener('click', () => navigate('workouts'));
  document.getElementById('cancel').addEventListener('click', () => navigate('workouts'));
  document.getElementById('create').addEventListener('click', () => {
    const date = document.getElementById('w-date').value;
    if (!date) return;
    const w = createWorkout(date);
    navigate(`workout/${w.id}`);
  });
  document.getElementById('generate').addEventListener('click', () => navigate('workout/generate'));
}

function renderWorkoutDetail(id) {
  const workout = getWorkout(id);
  if (!workout) { navigate('workouts'); return; }
  const allEx = loadExercises();
  const workoutExercises = workout.exerciseIds.map(eid => allEx.find(e => e.id === eid)).filter(Boolean);

  // ── Summary mode: workout already finished ──────────────────────────────────
  if (workout.finishedAt) {
    const weights = workout.weights || {};

    // For each exercise, find the most recent previous finished workout that recorded a weight
    const prevWorkouts = loadWorkouts()
      .filter(w => w.finishedAt && w.finishedAt < workout.finishedAt && w.weights)
      .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
    const prevWeightFor = eid => {
      for (const pw of prevWorkouts)
        if (typeof pw.weights[eid] === 'number') return pw.weights[eid];
      return null;
    };

    document.getElementById('app').innerHTML = `
      <div class="page">
        <div class="header">
          <button class="btn-back" id="back">${backArrow} ${t('btn.back')}</button>
          <h1>${escHtml(formatDate(workout.date))}</h1>
        </div>
        <div class="content">
          ${workoutExercises.length === 0 ? `
            <div class="empty-state" style="height:36vh">
              <h2>${t('workout.noExercises')}</h2>
            </div>
          ` : `
            <div class="exercise-list" style="margin-bottom:16px">
              ${workoutExercises.map(e => {
                const cats = getCategories(e);
                const catText = cats.length ? cats.map(categoryLabel).join(', ') : '';
                const w = weights[e.id];
                const weightLabel = w != null ? `${w} ${t('unit.kg')}` : null;

                let deltaHTML = '';
                if (typeof w === 'number') {
                  const prev = prevWeightFor(e.id);
                  if (prev !== null) {
                    const diff = Math.round((w - prev) * 10) / 10;
                    if (diff > 0)
                      deltaHTML = `<span class="weight-delta delta-up">+${diff} ${t('unit.kg')}</span>`;
                    else if (diff < 0)
                      deltaHTML = `<span class="weight-delta delta-down">${diff} ${t('unit.kg')}</span>`;
                  }
                }

                return `
                  <div class="exercise-card no-chevron">
                    ${exerciseIconHTML(e)}
                    <div class="exercise-card-info">
                      <div class="exercise-card-name">${escHtml(e.name)}</div>
                      ${catText ? `<div class="exercise-card-preview">${escHtml(catText)}</div>` : ''}
                    </div>
                    <div class="exercise-card-right">
                      ${weightLabel ? `<span class="weight-badge">${escHtml(weightLabel)}</span>` : ''}
                      ${deltaHTML}
                    </div>
                  </div>`;
              }).join('')}
            </div>
          `}
          <button class="btn btn-danger" id="del-workout">${t('btn.deleteWorkout')}</button>
        </div>
      </div>
    `;
    document.getElementById('back').addEventListener('click', () => navigate('workouts'));
    document.getElementById('del-workout').addEventListener('click', () => {
      showConfirm(t('confirm.deleteWorkout'), () => { deleteWorkout(id); navigate('workouts'); });
    });
    return;
  }

  // ── Building mode: workout in progress ─────────────────────────────────────
  function goBack() {
    if (workoutExercises.length > 0) {
      // Not started — leaving discards the whole workout (confirm first)
      showConfirm(t('confirm.discardWorkout'), () => {
        deleteWorkout(id);
        navigate('workouts');
      });
      return;
    }
    // Empty workout — silently remove the shell so it never appears in the list
    deleteWorkout(id);
    navigate('workouts');
  }

  document.getElementById('app').innerHTML = `
    <div class="page">
      <div class="header">
        <button class="btn-back" id="back">${backArrow} ${t('btn.back')}</button>
        <h1>${escHtml(formatDate(workout.date))}</h1>
      </div>
      <div class="content">
        ${workoutExercises.length === 0 ? `
          <div class="empty-state" style="height:36vh">
            <h2>${t('workout.noExercisesYet')}</h2>
            <p>${escHtml(t('workout.buildHint'))}</p>
          </div>
        ` : `
          <div class="exercise-list" style="margin-bottom:16px">
            ${workoutExercises.map(e => {
              const cats = getCategories(e);
              const catText = cats.length ? cats.map(categoryLabel).join(', ') : '';
              return `
                <div class="exercise-card-row">
                  <div class="exercise-card no-chevron" style="flex:1">
                    ${exerciseIconHTML(e)}
                    <div class="exercise-card-info">
                      <div class="exercise-card-name">${escHtml(e.name)}</div>
                      ${catText ? `<div class="exercise-card-preview">${escHtml(catText)}</div>` : ''}
                    </div>
                  </div>
                  <button class="btn-remove" data-eid="${e.id}" aria-label="${t('btn.delete')}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>`;
            }).join('')}
          </div>
        `}
        <button class="btn btn-primary" id="add-ex">${t('btn.addExercise')}</button>
        ${workoutExercises.length > 0 ? `<button class="btn btn-save" id="start-workout">${t('btn.startWorkout')}</button>` : ''}
        <button class="btn btn-danger" id="del-workout">${t('btn.deleteWorkout')}</button>
      </div>
    </div>
  `;
  document.getElementById('back').addEventListener('click', goBack);
  document.getElementById('add-ex').addEventListener('click', () => navigate(`workout/${id}/add`));
  document.getElementById('del-workout').addEventListener('click', () => {
    showConfirm(t('confirm.deleteWorkout'), () => { deleteWorkout(id); navigate('workouts'); });
  });
  document.getElementById('start-workout')?.addEventListener('click', () => navigate(`workout/${id}/active`));
  document.querySelectorAll('.btn-remove').forEach(btn =>
    btn.addEventListener('click', () => { removeExFromWorkout(id, btn.dataset.eid); renderWorkoutDetail(id); })
  );
}

function renderWorkoutAddExercise(workoutId) {
  const workout = getWorkout(workoutId);
  if (!workout) { navigate('workouts'); return; }
  const available = loadExercises().filter(e => !workout.exerciseIds.includes(e.id));

  document.getElementById('app').innerHTML = `
    <div class="page">
      <div class="header">
        <button class="btn-back" id="back">${backArrow} ${t('btn.back')}</button>
        <h1>${t('addex.title')}</h1>
      </div>
      <div class="content">
        ${available.length > 0 ? `
          <p class="section-label">${t('addex.fromList')}</p>
          <div class="exercise-list" id="picker-list">
            ${available.map(e => {
              const cats = getCategories(e);
              const catText = cats.length ? cats.map(categoryLabel).join(', ') : '';
              return `
                <div class="exercise-card picker-item" data-id="${e.id}">
                  ${exerciseIconHTML(e)}
                  <div class="exercise-card-info">
                    <div class="exercise-card-name">${escHtml(e.name)}</div>
                    ${catText ? `<div class="exercise-card-preview">${escHtml(catText)}</div>` : ''}
                  </div>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>`;
            }).join('')}
          </div>
          <div class="divider"></div>
        ` : ''}
        <p class="section-label">${t('addex.createNew')}</p>
        <div class="form-group">
          <label class="form-label" for="new-name">${t('field.name')}</label>
          <input class="form-input" id="new-name" type="text" placeholder="${escHtml(t('ph.name2'))}" autocomplete="off" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('field.category')}</label>
          ${categoryPillsHTML()}
        </div>
        <div class="form-group">
          <label class="form-label" for="new-desc">${t('field.description')}</label>
          <textarea class="form-textarea" id="new-desc" placeholder="${escHtml(t('ph.desc2'))}" style="min-height:100px"></textarea>
        </div>
        <button class="btn btn-primary" id="create-add">${t('btn.createAndAdd')}</button>
      </div>
    </div>
  `;
  document.getElementById('back').addEventListener('click', () => navigate(`workout/${workoutId}`));
  document.querySelectorAll('.picker-item').forEach(card =>
    card.addEventListener('click', () => { addExToWorkout(workoutId, card.dataset.id); navigate(`workout/${workoutId}`); })
  );
  document.getElementById('create-add').addEventListener('click', () => {
    const name = document.getElementById('new-name').value.trim();
    const cats = readSelectedCategories();
    if (!name) { const inp = document.getElementById('new-name'); inp.focus(); inp.style.borderColor = '#E53935'; return; }
    if (!cats.length) { document.getElementById('cat-grid').classList.add('cat-grid-error'); return; }
    const ex = addExercise(name, document.getElementById('new-desc').value.trim(), cats);
    addExToWorkout(workoutId, ex.id);
    navigate(`workout/${workoutId}`);
  });
  document.getElementById('new-name')?.addEventListener('input', e => { e.target.style.borderColor = ''; });
  document.querySelectorAll('.cat-pill').forEach(btn =>
    btn.addEventListener('click', () => {
      btn.classList.toggle('cat-pill-active');
      document.getElementById('cat-grid').classList.remove('cat-grid-error');
    })
  );
}

// ─── Workout generator (view) ──────────────────────────────────────────────────

function renderWorkoutGenerate(previewExercises = null, savedDate = null, savedGroups = []) {
  const date = savedDate || todayISO();
  const hasPreview = previewExercises !== null;

  const previewHTML = hasPreview ? `
    <div class="divider"></div>
    ${previewExercises.length === 0 ? `
      <div class="empty-state" style="height:22vh">
        <h2 style="font-size:17px">${t('gen.noMatch.title')}</h2>
        <p>${escHtml(t('gen.noMatch.body'))}</p>
      </div>
    ` : `
      <p class="section-label">${escHtml(t('gen.count', { n: previewExercises.length, ex: plural(previewExercises.length, t('count.exercise')) }))}</p>
      ${previewExercises.length < 5 ? `<p class="generate-note">${escHtml(t('gen.onlyFound', { n: previewExercises.length }))}</p>` : ''}
      <div class="exercise-list" style="margin-bottom:16px">
        ${previewExercises.map(e => {
          const catText = getCategories(e).map(categoryLabel).join(', ');
          return `
            <div class="exercise-card no-chevron">
              ${exerciseIconHTML(e)}
              <div class="exercise-card-info">
                <div class="exercise-card-name">${escHtml(e.name)}</div>
                ${catText ? `<div class="exercise-card-preview">${escHtml(catText)}</div>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>
      <button class="btn btn-primary" id="start-workout">${t('btn.startWorkout')}</button>
      <button class="btn btn-ghost" id="regenerate">${t('gen.regenerate')}</button>
    `}
  ` : '';

  document.getElementById('app').innerHTML = `
    <div class="page">
      <div class="header">
        <button class="btn-back" id="back">${backArrow} ${t('btn.back')}</button>
        <h1>${t('gen.title')}</h1>
      </div>
      <div class="content">
        <div class="form-group">
          <label class="form-label" for="w-date">${t('field.date')}</label>
          <input class="form-input date-input" id="w-date" type="date" value="${date}" />
        </div>
        <div class="form-group">
          <label class="form-label">${t('gen.muscleGroups')}</label>
          ${muscleGroupPillsHTML(savedGroups)}
        </div>
        <button class="btn ${hasPreview && previewExercises.length ? 'btn-ghost' : 'btn-primary'}" id="generate-btn">
          ${hasPreview && previewExercises.length ? t('gen.regenerate') : t('gen.btn')}
        </button>
        ${previewHTML}
      </div>
    </div>
  `;

  document.getElementById('back').addEventListener('click', () => navigate('workout/new'));

  document.querySelectorAll('.group-pill').forEach(btn =>
    btn.addEventListener('click', () => {
      btn.classList.toggle('cat-pill-active');
      document.getElementById('group-grid').classList.remove('cat-grid-error');
    })
  );

  document.getElementById('generate-btn').addEventListener('click', () => {
    const groups = readSelectedGroups();
    if (!groups.length) {
      document.getElementById('group-grid').classList.add('cat-grid-error');
      return;
    }
    renderWorkoutGenerate(generateExercises(groups), document.getElementById('w-date').value, groups);
  });

  document.getElementById('regenerate')?.addEventListener('click', () => {
    const groups = readSelectedGroups().length ? readSelectedGroups() : savedGroups;
    renderWorkoutGenerate(generateExercises(groups), document.getElementById('w-date').value, groups);
  });

  document.getElementById('start-workout')?.addEventListener('click', () => {
    if (!previewExercises?.length) return;
    const d = document.getElementById('w-date').value || todayISO();
    const w = createWorkout(d);
    previewExercises.forEach(e => addExToWorkout(w.id, e.id));
    navigate(`workout/${w.id}/active`);
  });
}

// ─── Active workout ───────────────────────────────────────────────────────────

function renderWorkoutActive(id) {
  const workout = getWorkout(id);
  if (!workout) { navigate('workouts'); return; }
  if (workout.finishedAt) { navigate(`workout/${id}`); return; }

  const allEx = loadExercises();
  const exercises = workout.exerciseIds.map(eid => allEx.find(e => e.id === eid)).filter(Boolean);
  if (!exercises.length) { navigate(`workout/${id}`); return; }

  // exerciseId → number (kg) | null (bodyweight); undefined = not done yet
  const doneWeights = {};
  let openDropdownEid = null;

  // Precompute once — avoids repeated localStorage reads per rebuild
  const prevWeights = Object.fromEntries(exercises.map(e => [e.id, getPrevWeight(e.id)]));

  function rebuildList() {
    const listEl = document.getElementById('active-list');
    if (!listEl) return;

    listEl.innerHTML = exercises.map(e => {
      const isDone = Object.prototype.hasOwnProperty.call(doneWeights, e.id);
      const w = doneWeights[e.id];
      const weightLabel = w != null ? `${w} ${t('unit.kg')}` : t('unit.bw');
      const cats = getCategories(e);
      const catText = cats.map(categoryLabel).join(', ');
      const isOpen = openDropdownEid === e.id;

      const prev = prevWeights[e.id];
      const prevLabel = prev.found ? (prev.value != null ? `${prev.value} ${t('unit.kg')}` : t('unit.bw')) : null;
      const inputValue = (prev.found && prev.value != null) ? `value="${prev.value}"` : '';

      return `
        <div class="exercise-active-item">
          <div class="exercise-card no-chevron ${isDone ? 'ex-done' : ''} ${isOpen ? 'card-dropdown-open' : ''}">
            ${exerciseIconHTML(e)}
            <div class="exercise-card-info">
              <div class="exercise-card-name">${escHtml(e.name)}</div>
              ${catText ? `<div class="exercise-card-preview">${escHtml(catText)}</div>` : ''}
              ${prevLabel ? `<div class="exercise-card-prev">${escHtml(t('active.last', { v: prevLabel }))}</div>` : ''}
            </div>
            ${isDone
              ? `<span class="weight-badge">
                   <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px">
                     <polyline points="1.5,6.5 4.5,9.5 10.5,2.5"/>
                   </svg>${escHtml(weightLabel)}</span>`
              : `<button class="btn-done" data-eid="${escHtml(e.id)}">${t('btn.done')}</button>`
            }
          </div>
          <div class="weight-dropdown" id="wd-${escHtml(e.id)}">
            <div class="weight-dropdown-inner">
              <div class="weight-input-row">
                <input class="form-input weight-picker-input" id="wp-${escHtml(e.id)}"
                       type="number" min="0" step="0.5" placeholder="0" inputmode="decimal" ${inputValue} />
                <span class="weight-unit">${t('unit.kg')}</span>
              </div>
              <div class="weight-dropdown-actions">
                <button class="wd-btn wd-bw" data-eid="${escHtml(e.id)}">${t('btn.noWeight')}</button>
                <button class="wd-btn wd-save" data-eid="${escHtml(e.id)}">${t('btn.saveShort')}</button>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');

    // Animate open dropdown in after paint
    if (openDropdownEid) {
      requestAnimationFrame(() => {
        document.getElementById(`wd-${openDropdownEid}`)?.classList.add('open');
        const inp = document.getElementById(`wp-${openDropdownEid}`);
        inp?.focus();
        inp?.select();
      });
    }

    // Done button → open dropdown for that exercise
    listEl.querySelectorAll('.btn-done').forEach(btn => {
      btn.addEventListener('click', () => {
        openDropdownEid = openDropdownEid === btn.dataset.eid ? null : btn.dataset.eid;
        rebuildList();
      });
    });

    // Save button
    listEl.querySelectorAll('.wd-save').forEach(btn => {
      btn.addEventListener('click', () => {
        const eid = btn.dataset.eid;
        const raw = parseFloat(document.getElementById(`wp-${eid}`)?.value);
        doneWeights[eid] = (isNaN(raw) || raw <= 0) ? null : raw;
        openDropdownEid = null;
        rebuildList();
      });
    });

    // No weight button
    listEl.querySelectorAll('.wd-bw').forEach(btn => {
      btn.addEventListener('click', () => {
        doneWeights[btn.dataset.eid] = null;
        openDropdownEid = null;
        rebuildList();
      });
    });

    // Enter key in weight input
    listEl.querySelectorAll('.weight-picker-input').forEach(input => {
      input.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        const eid = openDropdownEid;
        if (!eid) return;
        const raw = parseFloat(e.target.value);
        doneWeights[eid] = (isNaN(raw) || raw <= 0) ? null : raw;
        openDropdownEid = null;
        rebuildList();
      });
    });
  }

  document.getElementById('app').innerHTML = `
    <div class="page">
      <div class="header">
        <button class="btn-back" id="back">${backArrow} ${t('btn.back')}</button>
        <h1>${escHtml(formatDate(workout.date))}</h1>
      </div>
      <div class="content">
        <p class="generate-note" style="margin-bottom:16px">${escHtml(t('active.hint'))}</p>
        <div class="exercise-list" id="active-list" style="margin-bottom:20px"></div>
        <button class="btn btn-primary" id="finish">${t('btn.finishWorkout')}</button>
      </div>
    </div>
  `;

  rebuildList();

  document.getElementById('back').addEventListener('click', () => {
    if (Object.keys(doneWeights).length > 0) {
      showConfirm(t('confirm.leaveWorkout'), () => navigate(`workout/${id}`));
    } else {
      navigate(`workout/${id}`);
    }
  });

  document.getElementById('finish').addEventListener('click', () => {
    finishWorkout(id, doneWeights);
    showSavePopup();
  });
}
