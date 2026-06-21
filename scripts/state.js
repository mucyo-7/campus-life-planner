import { loadRecords, saveRecords, loadSettings, saveSettings } from './storage.js';

const DEFAULT_SETTINGS = {
  unitPref: 'minutes',
  weeklyCapMinutes: 0,
  customTags: []
};

let records = loadRecords();
let settings = { ...DEFAULT_SETTINGS, ...loadSettings() };
let sortKey = 'dueDate';
let sortDir = 1;

// ---- Records ----

export function getRecords() { return records; }

export function addRecord(record) {
  records.push(record);
  saveRecords(records);
}

export function updateRecord(id, updates) {
  records = records.map(r =>
    r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
  );
  saveRecords(records);
}

export function deleteRecord(id) {
  records = records.filter(r => r.id !== id);
  saveRecords(records);
}

export function getRecord(id) {
  return records.find(r => r.id === id) || null;
}

// ---- Sorting ----

export function setSortKey(key) {
  if (sortKey === key) {
    sortDir *= -1;
  } else {
    sortKey = key;
    sortDir = 1;
  }
}

export function getSorted(list = records) {
  return [...list].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (sortKey === 'duration') {
      av = Number(av); bv = Number(bv);
    } else {
      av = String(av).toLowerCase();
      bv = String(bv).toLowerCase();
    }
    if (av < bv) return -1 * sortDir;
    if (av > bv) return  1 * sortDir;
    return 0;
  });
}

// ---- ID generator ----

export function generateId() {
  const max = records.length
    ? Math.max(...records.map(r => parseInt(r.id.replace('rec_', '')) || 0))
    : 0;
  return `rec_${String(max + 1).padStart(4, '0')}`;
}

// ---- Settings ----

export function getSettings() { return settings; }

export function updateSettings(updates) {
  settings = { ...settings, ...updates };
  saveSettings(settings);
}

// ---- Stats ----

export function getStats() {
  const total = records.length;
  const totalDuration = records.reduce((s, r) => s + Number(r.duration), 0);

  const tagCount = {};
  records.forEach(r => { tagCount[r.tag] = (tagCount[r.tag] || 0) + 1; });
  const topTag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);
  const dueThisWeek = records.filter(r => {
    const d = new Date(r.dueDate);
    return d >= now && d <= weekEnd;
  }).length;

  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayDuration = records
      .filter(r => r.dueDate === dateStr)
      .reduce((s, r) => s + Number(r.duration), 0);
    trend.push({ date: dateStr, duration: dayDuration, label: d.toLocaleDateString('en', { weekday: 'short' }) });
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const thisWeekDuration = records.filter(r => {
    const d = new Date(r.dueDate);
    return d >= weekStart && d <= weekEnd;
  }).reduce((s, r) => s + Number(r.duration), 0);

  return { total, totalDuration, topTag, dueThisWeek, trend, thisWeekDuration };
}