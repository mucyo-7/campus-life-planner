import {
  getRecords, addRecord, updateRecord, deleteRecord, getRecord,
  getSorted, setSortKey, generateId, getSettings, updateSettings, getStats
} from './state.js';
import { validateForm, validateTag } from './validators.js';
import { compileRegex, highlight, filterRecords, escapeHtml } from './search.js';
import { exportJSON, importJSON } from './storage.js';

// =============================================
// ANNOUNCE HELPERS
// =============================================
function announce(msg, type = 'polite') {
  const el = document.getElementById(type === 'assertive' ? 'alert-msg' : 'status-msg');
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = msg; });
}

// =============================================
// PAGE NAVIGATION
// =============================================
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.hidden = true;
  });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.remove('active');
    l.removeAttribute('aria-current');
  });

  const page = document.getElementById(`page-${name}`);
  const link = document.querySelector(`[data-page="${name}"]`);
  if (page) { page.classList.add('active'); page.hidden = false; }
  if (link) { link.classList.add('active'); link.setAttribute('aria-current', 'page'); }

  if (name === 'dashboard') renderDashboard();
  if (name === 'records') renderRecords();

  document.querySelector('nav').classList.remove('open');
  document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
}

// =============================================
// RENDER DASHBOARD
// =============================================
function renderDashboard() {
  const stats = getStats();
  const settings = getSettings();

  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-top-tag').textContent = stats.topTag;
  document.getElementById('stat-due-week').textContent = stats.dueThisWeek;

  const dur = settings.unitPref === 'hours'
    ? (stats.totalDuration / 60).toFixed(1) + 'h'
    : stats.totalDuration + ' min';
  document.getElementById('stat-duration').textContent = dur;

  const cap = settings.weeklyCapMinutes || 0;
  const capInput = document.getElementById('cap-input');
  if (cap && !capInput.value) capInput.value = cap;

  const bar = document.getElementById('cap-bar-fill');
  const capStatus = document.getElementById('cap-status');
  const capBar = document.getElementById('cap-bar');

  if (cap > 0) {
    const pct = Math.min((stats.thisWeekDuration / cap) * 100, 100);
    bar.style.width = pct + '%';
    capBar.setAttribute('aria-valuenow', Math.round(pct));

    if (stats.thisWeekDuration > cap) {
      bar.classList.add('over');
      capStatus.classList.add('over'); capStatus.classList.remove('ok');
      const over = stats.thisWeekDuration - cap;
      capStatus.textContent = `Over target by ${over} minutes this week!`;
      announce(`Warning: you exceeded your weekly target by ${over} minutes.`, 'assertive');
    } else {
      bar.classList.remove('over');
      capStatus.classList.add('ok'); capStatus.classList.remove('over');
      const rem = cap - stats.thisWeekDuration;
      capStatus.textContent = `${rem} minutes remaining this week.`;
    }
  } else {
    bar.style.width = '0%';
    capStatus.textContent = 'No target set.';
  }

  const chart = document.getElementById('trend-chart');
  chart.innerHTML = '';
  const maxDur = Math.max(...stats.trend.map(d => d.duration), 1);
  stats.trend.forEach(day => {
    const heightPct = (day.duration / maxDur) * 100;
    const wrap = document.createElement('div');
    wrap.className = 'trend-bar-wrap';
    wrap.innerHTML = `
      <div class="trend-bar" style="height:${heightPct}%" data-value="${day.duration}"
           role="img" aria-label="${day.label}: ${day.duration} minutes"></div>
      <span class="trend-day">${day.label}</span>
    `;
    chart.appendChild(wrap);
  });
}

// =============================================
// RENDER RECORDS TABLE
// =============================================
let currentSearch = '';
let caseSensitive = false;

function renderRecords() {
  const re = compileRegex(currentSearch, caseSensitive);
  const sorted = getSorted();
  const filtered = filterRecords(sorted, re);
  const tbody = document.getElementById('records-tbody');
  const emptyMsg = document.getElementById('empty-msg');
  const settings = getSettings();

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    emptyMsg.hidden = false;
    return;
  }
  emptyMsg.hidden = true;

  filtered.forEach(rec => {
    const displayDur = settings.unitPref === 'hours'
      ? (Number(rec.duration) / 60).toFixed(1) + 'h'
      : rec.duration + ' min';

    const titleHtml = highlight(rec.title, re);
    const tagHtml = highlight(rec.tag, re);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Title">${titleHtml}</td>
      <td data-label="Due Date">${escapeHtml(rec.dueDate)}</td>
      <td data-label="Duration">${escapeHtml(displayDur)}</td>
      <td data-label="Tag"><span class="tag-pill">${tagHtml}</span></td>
      <td data-label="Actions">
        <button class="btn-icon" data-action="edit" data-id="${rec.id}" aria-label="Edit ${escapeHtml(rec.title)}">✏️</button>
        <button class="btn-icon" data-action="delete" data-id="${rec.id}" aria-label="Delete ${escapeHtml(rec.title)}">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// =============================================
// FORM — ADD / EDIT
// =============================================
function resetForm() {
  document.getElementById('edit-id').value = '';
  document.getElementById('f-title').value = '';
  document.getElementById('f-dueDate').value = '';
  document.getElementById('f-duration').value = '';
  document.getElementById('f-tag').value = '';
  document.getElementById('form-heading').textContent = 'Add Task';
  clearErrors();
}

function clearErrors() {
  ['f-title-err', 'f-date-err', 'f-dur-err', 'f-tag-err'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

function showErrors(errors) {
  if (errors.title)    document.getElementById('f-title-err').textContent = errors.title;
  if (errors.dueDate)  document.getElementById('f-date-err').textContent = errors.dueDate;
  if (errors.duration) document.getElementById('f-dur-err').textContent = errors.duration;
  if (errors.tag)      document.getElementById('f-tag-err').textContent = errors.tag;
}

function loadRecordIntoForm(id) {
  const rec = getRecord(id);
  if (!rec) return;
  document.getElementById('edit-id').value = rec.id;
  document.getElementById('f-title').value = rec.title;
  document.getElementById('f-dueDate').value = rec.dueDate;
  document.getElementById('f-duration').value = rec.duration;
  document.getElementById('f-tag').value = rec.tag;
  document.getElementById('form-heading').textContent = 'Edit Task';
  showPage('add');
}

// =============================================
// SETTINGS
// =============================================
function renderSettings() {
  const settings = getSettings();
  document.getElementById('unit-pref').value = settings.unitPref || 'minutes';

  const list = document.getElementById('custom-tags-list');
  list.innerHTML = '';
  (settings.customTags || []).forEach(tag => {
    const li = document.createElement('li');
    li.innerHTML = `${escapeHtml(tag)} <button class="btn-icon" data-remove-tag="${escapeHtml(tag)}" aria-label="Remove tag ${escapeHtml(tag)}">×</button>`;
    list.appendChild(li);
  });

  syncTagOptions(settings.customTags || []);
}

function syncTagOptions(customTags) {
  const sel = document.getElementById('f-tag');
  sel.querySelectorAll('[data-custom]').forEach(o => o.remove());
  customTags.forEach(tag => {
    const opt = document.createElement('option');
    opt.value = tag;
    opt.textContent = tag;
    opt.setAttribute('data-custom', '1');
    sel.appendChild(opt);
  });
}

// =============================================
// EVENT WIRING
// =============================================
document.addEventListener('DOMContentLoaded', () => {

  // --- Nav links ---
  document.querySelectorAll('.nav-link, [data-page]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      if (page) {
        if (page === 'add') resetForm();
        if (page === 'settings') renderSettings();
        showPage(page);
      }
    });
  });

  // --- Mobile menu toggle ---
  const toggle = document.querySelector('.menu-toggle');
  toggle.addEventListener('click', () => {
    const nav = document.querySelector('nav');
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });

  // --- Sort buttons ---
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      setSortKey(btn.dataset.sort);
      renderRecords();
    });
  });

  // --- Search ---
  document.getElementById('search-input').addEventListener('input', e => {
    currentSearch = e.target.value;
    renderRecords();
  });

  document.getElementById('search-case').addEventListener('change', e => {
    caseSensitive = e.target.checked;
    renderRecords();
  });

  // --- Table actions (edit / delete) via delegation ---
  document.getElementById('records-tbody').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;

    if (action === 'edit') {
      loadRecordIntoForm(id);
    }

    if (action === 'delete') {
      if (confirm('Delete this task? This cannot be undone.')) {
        deleteRecord(id);
        renderRecords();
        renderDashboard();
        announce('Task deleted.');
      }
    }
  });

  // --- Save task form ---
  document.getElementById('save-btn').addEventListener('click', () => {
    const title    = document.getElementById('f-title').value;
    const dueDate  = document.getElementById('f-dueDate').value;
    const duration = document.getElementById('f-duration').value;
    const tag      = document.getElementById('f-tag').value;
    const editId   = document.getElementById('edit-id').value;

    clearErrors();
    const { valid, errors } = validateForm({ title, dueDate, duration, tag });

    if (!valid) {
      showErrors(errors);
      const firstErr = Object.keys(errors).find(k => errors[k]);
      const fieldMap = { title: 'f-title', dueDate: 'f-dueDate', duration: 'f-duration', tag: 'f-tag' };
      document.getElementById(fieldMap[firstErr])?.focus();
      return;
    }

    const now = new Date().toISOString();

    if (editId) {
      updateRecord(editId, { title, dueDate, duration: Number(duration), tag });
      announce('Task updated successfully.');
    } else {
      addRecord({
        id: generateId(),
        title,
        dueDate,
        duration: Number(duration),
        tag,
        createdAt: now,
        updatedAt: now
      });
      announce('Task added successfully.');
    }

    resetForm();
    showPage('records');
  });

  // --- Cancel ---
  document.getElementById('cancel-btn').addEventListener('click', () => {
    resetForm();
    showPage('records');
  });

  // --- Export ---
  document.getElementById('export-btn').addEventListener('click', () => {
    exportJSON(getRecords());
    announce('Records exported.');
  });

  // --- Import ---
  document.getElementById('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await importJSON(file);
      if (confirm(`Import ${data.length} records? This will REPLACE all existing records.`)) {
        const { saveRecords } = await import('./storage.js');
        saveRecords(data);
        location.reload();
      }
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
    e.target.value = '';
  });

  // --- Cap save ---
  document.getElementById('cap-save-btn').addEventListener('click', () => {
    const val = Number(document.getElementById('cap-input').value);
    updateSettings({ weeklyCapMinutes: val });
    renderDashboard();
    announce('Weekly target saved.');
  });

  // --- Settings save ---
  document.getElementById('save-settings-btn').addEventListener('click', () => {
    const unitPref = document.getElementById('unit-pref').value;
    updateSettings({ unitPref });
    announce('Settings saved.');
  });

  // --- Add custom tag ---
  document.getElementById('add-tag-btn').addEventListener('click', () => {
    const input = document.getElementById('custom-tag');
    const val = input.value.trim();
    const err = validateTag(val);
    document.getElementById('tag-err').textContent = err || '';
    if (err) return;

    const settings = getSettings();
    const tags = settings.customTags || [];
    if (tags.includes(val)) {
      document.getElementById('tag-err').textContent = 'Tag already exists.';
      return;
    }
    updateSettings({ customTags: [...tags, val] });
    input.value = '';
    renderSettings();
    announce(`Tag "${val}" added.`);
  });

  // --- Remove custom tag (delegation) ---
  document.getElementById('custom-tags-list').addEventListener('click', e => {
    const btn = e.target.closest('[data-remove-tag]');
    if (!btn) return;
    const tag = btn.dataset.removeTag;
    const settings = getSettings();
    updateSettings({ customTags: (settings.customTags || []).filter(t => t !== tag) });
    renderSettings();
    announce(`Tag "${tag}" removed.`);
  });

  // --- Clear all data ---
  document.getElementById('clear-data-btn').addEventListener('click', () => {
    if (confirm('Clear ALL data? This cannot be undone.')) {
      localStorage.clear();
      location.reload();
    }
  });

  // --- Initial render ---
  showPage('dashboard');
});