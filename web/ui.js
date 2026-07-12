// ui.js — shared UI primitives & formatters. Loaded after store.js, before views.js.
// Escaping, date formatting, icons, category/group pills, weight chart, tab bar,
// confirm modal, save popup. Depends on i18n (t) and store (constants/CRUD).

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDate(dateStr) {
  if (dateStr === todayISO())     return t('date.today');
  if (dateStr === yesterdayISO()) return t('date.yesterday');
  const [y, m, d] = dateStr.split('-').map(Number);
  const locale = getLang() === 'ru' ? 'ru-RU' : 'en-US';
  return new Date(y, m - 1, d).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

const backArrow = `
  <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
    <path d="M9 1L1 8.5 9 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

const chevronRight = `
  <svg class="exercise-card-arrow" width="8" height="14" viewBox="0 0 8 14" fill="none">
    <path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

// ─── Category / group view helpers ────────────────────────────────────────────

const GROUP_ICONS = {
  arms: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="7.5" y1="12" x2="16.5" y2="12"/>
    <rect x="1" y="9.5" width="6.5" height="5" rx="1.5"/>
    <rect x="16.5" y="9.5" width="6.5" height="5" rx="1.5"/>
  </svg>`,
  chest: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 7Q4 16 12 16"/>
    <path d="M20 7Q20 16 12 16"/>
    <path d="M4 7Q8 4 12 5"/>
    <path d="M20 7Q16 4 12 5"/>
    <line x1="12" y1="5" x2="12" y2="16"/>
  </svg>`,
  back: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="3" x2="12" y2="21"/>
    <rect x="1" y="7" width="5" height="10" rx="1.5"/>
    <rect x="18" y="7" width="5" height="10" rx="1.5"/>
    <line x1="6" y1="12" x2="18" y2="12"/>
  </svg>`,
  core: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="7" y="3" width="10" height="18" rx="2.5"/>
    <line x1="7" y1="9" x2="17" y2="9"/>
    <line x1="7" y1="15" x2="17" y2="15"/>
    <line x1="12" y1="9" x2="12" y2="21"/>
  </svg>`,
  legs: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5" y1="6" x2="19" y2="6"/>
    <line x1="9" y1="6" x2="6" y2="18"/>
    <line x1="15" y1="6" x2="18" y2="18"/>
    <line x1="4" y1="18" x2="8" y2="18"/>
    <line x1="16" y1="18" x2="20" y2="18"/>
  </svg>`,
};

function muscleGroupPillsHTML(selected = []) {
  return `
    <div class="cat-grid" id="group-grid">
      ${MUSCLE_GROUPS.map(g => `
        <button type="button" class="cat-pill group-pill ${selected.includes(g.value) ? 'cat-pill-active' : ''}" data-group="${g.value}">
          ${t('group.' + g.value)}
        </button>
      `).join('')}
    </div>`;
}

function readSelectedGroups() {
  return [...document.querySelectorAll('.group-pill.cat-pill-active')].map(b => b.dataset.group);
}

function categoryLabel(value) {
  if (!value) return '';
  return CATEGORIES.some(c => c.value === value) ? t('muscle.' + value) : value;
}

function workoutGroupIconsHTML(workout, allExercises) {
  const exMap = Object.fromEntries(allExercises.map(e => [e.id, e]));
  const groups = MUSCLE_GROUPS.filter(mg =>
    workout.exerciseIds.some(eid => {
      const ex = exMap[eid];
      return ex && getCategories(ex).some(c => mg.categories.includes(c));
    })
  );
  if (!groups.length) return '';
  return `<div class="workout-group-icons">
    ${groups.map(g => `<div class="exercise-card-icon icon-${g.value} icon-xs">${GROUP_ICONS[g.value]}</div>`).join('')}
  </div>`;
}

function exerciseIconHTML(exercise) {
  const cats = getCategories(exercise);
  for (const g of MUSCLE_GROUPS) {
    if (cats.some(c => g.categories.includes(c)))
      return `<div class="exercise-card-icon icon-${g.value}">${GROUP_ICONS[g.value]}</div>`;
  }
  return `<div class="exercise-card-icon">${GROUP_ICONS.arms}</div>`;
}

function categoryPillsHTML(selected = []) {
  return `
    <div class="cat-grid" id="cat-grid">
      ${CATEGORIES.map(c => `
        <button type="button" class="cat-pill ${selected.includes(c.value) ? 'cat-pill-active' : ''}" data-cat="${c.value}">
          ${t('muscle.' + c.value)}
        </button>
      `).join('')}
    </div>`;
}

function bindCategoryPills(getSelected) {
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('cat-pill-active');
    });
  });
}

function readSelectedCategories() {
  return [...document.querySelectorAll('.cat-pill.cat-pill-active')].map(b => b.dataset.cat);
}

// ─── Weight history chart ─────────────────────────────────────────────────────

function buildWeightChart(exerciseId, days) {
  const cutoff = Date.now() - days * 864e5;
  const pts = loadWorkouts()
    .filter(w => w.finishedAt && w.weights && typeof w.weights[exerciseId] === 'number')
    .filter(w => +new Date(w.finishedAt) >= cutoff)
    .map(w => ({ t: +new Date(w.finishedAt), kg: w.weights[exerciseId] }))
    .sort((a, b) => a.t - b.t);

  if (!pts.length)
    return `<p class="chart-empty">${t('chart.empty')}</p>`;
  if (pts.length === 1)
    return `<p class="chart-empty">${escHtml(t('chart.one', { kg: pts[0].kg }))}</p>`;

  const VW = 300, VH = 140, PL = 38, PR = 10, PT = 10, PB = 26;
  const CW = VW - PL - PR, CH = VH - PT - PB;
  const fmt = v => v.toFixed(1);

  const minKg = Math.min(...pts.map(p => p.kg));
  const maxKg = Math.max(...pts.map(p => p.kg));
  const kgSpan = maxKg - minKg;
  const kgPad  = kgSpan < 1 ? 5 : kgSpan * 0.15;
  const yMin = minKg - kgPad, yMax = maxKg + kgPad, ySpan = yMax - yMin;

  const minT = pts[0].t, maxT = pts[pts.length - 1].t, tSpan = maxT - minT;
  const sx = t  => PL + ((t  - minT) / tSpan) * CW;
  const sy = kg => PT + CH - ((kg - yMin) / ySpan) * CH;
  const sp = pts.map(p => ({ x: sx(p.t), y: sy(p.kg) }));

  // Catmull-Rom → cubic Bézier
  let d = `M${fmt(sp[0].x)},${fmt(sp[0].y)}`;
  const alpha = 0.5;
  for (let i = 0; i < sp.length - 1; i++) {
    const p0 = sp[Math.max(0, i - 1)], p1 = sp[i];
    const p2 = sp[i + 1], p3 = sp[Math.min(sp.length - 1, i + 2)];
    const t1x = alpha * (p2.x - p0.x), t1y = alpha * (p2.y - p0.y);
    const t2x = alpha * (p3.x - p1.x), t2y = alpha * (p3.y - p1.y);
    d += ` C${fmt(p1.x+t1x/3)},${fmt(p1.y+t1y/3)} ${fmt(p2.x-t2x/3)},${fmt(p2.y-t2y/3)} ${fmt(p2.x)},${fmt(p2.y)}`;
  }

  // Y-axis: 3 guide lines at min / mid / max
  const yVals = [minKg, (minKg + maxKg) / 2, maxKg];
  const yLines = yVals.map(v => {
    const y = fmt(sy(v));
    return `<line x1="${PL}" y1="${y}" x2="${VW - PR}" y2="${y}" stroke="var(--border)" stroke-width="0.8"/>
      <text x="${PL - 5}" y="${y}" text-anchor="end" dominant-baseline="middle" fill="var(--muted)" font-size="10">${Math.round(v * 10) / 10}</text>`;
  }).join('');

  // X-axis: 2 or 3 evenly-spaced date labels
  const xCount = days <= 7 ? 2 : 3;
  const xLabels = Array.from({ length: xCount }, (_, i) => {
    const t = minT + tSpan * (i / (xCount - 1));
    const label = new Date(t).toLocaleDateString(getLang() === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' });
    const anchor = i === 0 ? 'start' : i === xCount - 1 ? 'end' : 'middle';
    return `<text x="${fmt(sx(t))}" y="${VH - 4}" text-anchor="${anchor}" fill="var(--muted)" font-size="10">${escHtml(label)}</text>`;
  }).join('');

  const fill = `${d} L${fmt(sp[sp.length-1].x)},${PT+CH} L${fmt(sp[0].x)},${PT+CH} Z`;
  const dots = sp.map(p => `<circle cx="${fmt(p.x)}" cy="${fmt(p.y)}" r="3" fill="var(--accent)"/>`).join('');

  return `<svg viewBox="0 0 ${VW} ${VH}" width="100%" style="display:block;overflow:visible">
    ${yLines}
    <path d="${fill}" fill="var(--accent)" fill-opacity="0.08"/>
    <path d="${d}" stroke="var(--accent)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}
    ${xLabels}
  </svg>`;
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function tabBarHTML(active) {
  return `
    <nav class="tab-bar">
      <button class="tab-item ${active === 'exercises' ? 'active' : ''}" data-nav="list">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1.2" fill="currentColor"/>
          <circle cx="3" cy="12" r="1.2" fill="currentColor"/><circle cx="3" cy="18" r="1.2" fill="currentColor"/>
        </svg>
        <span>${t('tab.exercises')}</span>
      </button>
      <button class="tab-item ${active === 'workouts' ? 'active' : ''}" data-nav="workouts">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>${t('tab.workouts')}</span>
      </button>
    </nav>`;
}

function bindTabBar() {
  document.querySelectorAll('.tab-item[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });
}

// Persistent tab bar living outside #app (in #tabbar-root), so it isn't part of
// the per-view `.page` fade-in animation and never flickers on navigation.
// Built once, then only its .active state is toggled — the DOM node survives
// switches between the Exercises and Workouts tabs.
function renderTabBar(active) {
  const root = document.getElementById('tabbar-root');
  if (!root) return;
  const showTabs = active === 'exercises' || active === 'workouts';
  if (!showTabs) { root.innerHTML = ''; return; }
  if (!root.querySelector('.tab-bar')) {
    root.innerHTML = tabBarHTML(active);
    bindTabBar();
  }
  root.querySelectorAll('.tab-item[data-nav]').forEach(btn => {
    const isActive = (btn.dataset.nav === 'list' && active === 'exercises') ||
                     (btn.dataset.nav === 'workouts' && active === 'workouts');
    btn.classList.toggle('active', isActive);
  });
}

// ─── Confirm modal (replaces native confirm() — works in WKWebView) ──────────

function showConfirm(message, onOk, okLabel = t('btn.delete')) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card">
      <p class="modal-msg">${escHtml(message)}</p>
      <div class="modal-actions">
        <button class="modal-btn modal-btn-cancel" id="m-cancel">${t('btn.cancel')}</button>
        <button class="modal-btn modal-btn-ok" id="m-ok">${escHtml(okLabel)}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('modal-visible'));

  const close = () => {
    overlay.classList.remove('modal-visible');
    setTimeout(() => overlay.remove(), 220);
  };
  overlay.querySelector('#m-cancel').addEventListener('click', close);
  overlay.querySelector('#m-ok').addEventListener('click', () => { close(); onOk(); });
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

// ─── Save popup ───────────────────────────────────────────────────────────────

function showSavePopup() {
  const existing = document.getElementById('save-popup');
  if (existing) return;

  const popup = document.createElement('div');
  popup.id = 'save-popup';
  popup.className = 'save-popup';
  popup.innerHTML = `
    <div class="save-popup-inner">
      <svg class="save-check" width="52" height="52" viewBox="0 0 52 52" fill="none">
        <circle cx="26" cy="26" r="25" stroke="#FF6B00" stroke-width="2"/>
        <polyline points="14,27 22,35 38,18" stroke="#FF6B00" stroke-width="3"
          stroke-linecap="round" stroke-linejoin="round" fill="none"
          stroke-dasharray="36" stroke-dashoffset="36"/>
      </svg>
      <span class="save-popup-label">${t('popup.saved')}</span>
    </div>
  `;
  document.body.appendChild(popup);
  navigate('workouts');

  requestAnimationFrame(() => {
    popup.classList.add('save-popup-visible');
    const poly = popup.querySelector('polyline');
    if (poly) poly.style.strokeDashoffset = '0';
  });

  setTimeout(() => {
    popup.classList.add('save-popup-hiding');
    setTimeout(() => popup.remove(), 350);
  }, 1800);
}
